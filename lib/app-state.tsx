'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Customer, Shipment, ShipmentImage, Notification, SupportMessage, Activity, ActivityType, Session, ShipmentStatus, Address, ShippingMethod, PackageType, NotificationType, AdminProfile, TrackingEvent } from './types';
import { formatLongDate, formatTime } from './date-format';
import { getSupabaseBrowser } from './supabase/client';
import { broadcastShipmentChange } from './supabase/broadcast';
import { addressToJson, activityToModel, notificationToModel, profileToAdmin } from './supabase/mappers';
import { fetchAppData } from './supabase/data';
import type { Database } from './supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BrowserSupabaseClient = NonNullable<ReturnType<typeof getSupabaseBrowser>>;
type AuthResult = { success: boolean; error?: string; requiresEmailConfirmation?: boolean };

const STORAGE_KEY = 'logix-app-state-v1';

async function fetchAuthProfile(client: BrowserSupabaseClient, userId: string): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Your account profile could not be loaded.');
  return data;
}

function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

function now() {
  return new Date().toISOString();
}

/* Event stamps are stored as UTC ISO strings; formatting them with the UTC
   helpers keeps SSR (server zone) and hydration (browser zone) identical. */
function fmtDateOnly(iso: string) {
  return formatLongDate(iso);
}
function fmtTimeOnly(iso: string) {
  return formatTime(iso);
}

function randomTrackingNumber(): string {
  // US-style tracking numbers: a fixed "US" prefix followed by 10 digits.
  let num = '';
  for (let i = 0; i < 10; i++) num += Math.floor(Math.random() * 10);
  return `US${num}`;
}

const STATUS_ORDER: ShipmentStatus[] = [
  'Order Created',
  'Confirmed',
  'Picked Up',
  'In Transit',
  'Arrived at Facility',
  'Out for Delivery',
  'Delivered',
  'Exception',
];

const STATUS_NOTIF_MAP: Record<Exclude<ShipmentStatus, 'Order Created'>, NotificationType | null> = {
  'Confirmed': 'shipment_confirmed',
  'Picked Up': 'package_picked_up',
  'In Transit': 'shipment_in_transit',
  'Arrived at Facility': 'shipment_arrived_facility',
  'Out for Delivery': 'shipment_out_for_delivery',
  'Delivered': 'shipment_delivered',
  'Exception': 'delivery_exception',
};

const STATUS_NOTIF_TITLE: Record<Exclude<ShipmentStatus, 'Order Created'>, string> = {
  'Confirmed': 'Shipment Confirmed',
  'Picked Up': 'Package Picked Up',
  'In Transit': 'Shipment In Transit',
  'Arrived at Facility': 'Arrived at Facility',
  'Out for Delivery': 'Out for Delivery',
  'Delivered': 'Shipment Delivered',
  'Exception': 'Delivery Exception',
};

interface PersistedState {
  customers: Customer[];
  shipments: Shipment[];
  notifications: Notification[];
  activities: Activity[];
  supportMessages: SupportMessage[];
  adminProfile: AdminProfile;
}

const defaultAdminProfile: AdminProfile = {
  name: null,
  username: null,
  email: null,
  phone: null,
  role: 'admin',
  accountStatus: 'Active',
  createdAt: null,
  lastActive: null,
};

const defaultState: PersistedState = {
  customers: [],
  shipments: [],
  notifications: [],
  activities: [],
  supportMessages: [],
  adminProfile: defaultAdminProfile,
};

function makeStatusDescription(status: ShipmentStatus, location: string, method: ShippingMethod): string {
  switch (status) {
    case 'Order Created': return 'Shipment order created. Awaiting confirmation.';
    case 'Confirmed': return 'Shipment confirmed and label generated.';
    case 'Picked Up': return 'Package picked up from sender address.';
    case 'In Transit': return `In transit via ${method.toLowerCase()} shipping.`;
    case 'Arrived at Facility': return `Arrived at ${location}. Sorted for next step.`;
    case 'Out for Delivery': return `Out for final-mile delivery in ${location}.`;
    case 'Delivered': return 'Delivered successfully and signed off.';
    case 'Exception': return 'Delivery exception detected. Contact support for details.';
  }
}

/** True when a tracking event carries a real timestamp (i.e. it happened). */
function hasStamp(ev: TrackingEvent): boolean {
  return Boolean(ev.date || ev.time);
}

const STAMP_MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * Epoch (UTC ms) for a tracking event's display stamp.
 * Display stamps look like date `September 24, 2026` + time `05:55 PM`.
 * String comparison cannot order these (month names don't sort
 * chronologically, day numbers don't pad), so parse to a real number.
 * Undated (future) scans return +Infinity so they always sort last.
 * Stamped-but-unparseable returns 0 so it stays as old history, never ahead.
 */
function stampMs(ev: TrackingEvent): number {
  if (!hasStamp(ev)) return Number.POSITIVE_INFINITY;
  try {
    const d = (ev.date || '').trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
    const t = (ev.time || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!d || !t) return 0;
    const month = STAMP_MONTHS[d[1]];
    if (month === undefined) return 0;
    const day = parseInt(d[2], 10);
    const year = parseInt(d[3], 10);
    let hour = parseInt(t[1], 10) % 12;
    if (t[3].toUpperCase() === 'PM') hour += 12;
    const minute = parseInt(t[2], 10);
    if (!Number.isFinite(day) || !Number.isFinite(year) || !Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
    return Date.UTC(year, month, day, hour, minute);
  } catch {
    return 0;
  }
}

/**
 * Derive every tracking event's state from the shipment's **current** status.
 *
 * The status is the source of truth: whatever the operator or the automated
 * scan pipeline last set is what the timeline must reflect.
 *
 *   - the latest recorded scan for the current stage → 'current' (IN PROGRESS)
 *   - every other recorded (stamped) scan          → 'completed' (old history)
 *   - everything without a timestamp               → 'upcoming' (not happened)
 *
 * Ordering is chronological for recorded scans (oldest → newest) so the
 * latest update is always last and marked 'current', even when the status
 * moved backwards (e.g. Delivered → back to In Transit as a correction).
 * Old later-stage scans (Arrived / Out for Delivery / Delivered) therefore
 * stay in the past as completed history and are never rendered ahead as
 * upcoming. Exact duplicate rows (same stage + location + stamp, e.g. the
 * double "Arrived at Facility / Chicago / 05:55 PM" entry) are collapsed so
 * the timeline never shows the same scan twice. Undated plans sort last in
 * journey order. A shipment that is already 'Delivered' has no current step —
 * the whole journey reads back as completed.
 */
function dedupeStamped(events: Shipment['trackingEvents']): Shipment['trackingEvents'] {
  const seen = new Set<string>();
  const out: Shipment['trackingEvents'] = [];
  for (const ev of events) {
    if (hasStamp(ev)) {
      const key = `${ev.status}|||${(ev.location || '').trim().toLowerCase()}|||${stampMs(ev)}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(ev);
  }
  return out;
}

function applyTrackingStates(events: Shipment['trackingEvents'], status: ShipmentStatus): Shipment['trackingEvents'] {
  if (!events.length) return events;

  const deduped = dedupeStamped(events);
  const sorted = deduped.slice().sort((a, b) => {
    const aMs = stampMs(a);
    const bMs = stampMs(b);
    // Recorded scans first, oldest → newest, so the newest (latest update)
    // naturally lands last. Tie-break by stage for identical timestamps.
    if (aMs !== bMs) return aMs - bMs;
    return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });

  const currentIdx = STATUS_ORDER.indexOf(status);
  let currentId: string | null = null;

  if (status !== 'Delivered') {
    const matches = sorted.filter((ev) => ev.status === status && hasStamp(ev));
    const pool = matches.length
      ? matches
      : sorted.filter((ev) => hasStamp(ev) && STATUS_ORDER.indexOf(ev.status) <= currentIdx);
    currentId = pool.length ? pool[pool.length - 1].id : null;
  }

  return sorted.map((ev) => ({
    ...ev,
    state: ev.id === currentId ? 'current' : hasStamp(ev) ? 'completed' : 'upcoming',
  }));
}

function recomputeTrackingStates(shipments: Shipment[]): Shipment[] {
  return shipments.map((s) => ({ ...s, trackingEvents: applyTrackingStates(s.trackingEvents, s.status) }));
}

function initialLoad(): PersistedState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && Array.isArray(parsed.shipments)) {
        return {
          customers: parsed.customers ?? defaultState.customers,
          shipments: recomputeTrackingStates(parsed.shipments ?? defaultState.shipments),
          notifications: parsed.notifications ?? defaultState.notifications,
          activities: parsed.activities ?? defaultState.activities,
          supportMessages: parsed.supportMessages ?? defaultState.supportMessages,
          adminProfile: { ...defaultState.adminProfile, ...(parsed.adminProfile ?? {}) },
        };
      }
    }
  } catch {
    // ignore
  }
  return {
    ...defaultState,
    shipments: recomputeTrackingStates(defaultState.shipments),
  };
}

export interface AppStateContextValue {
  customers: Customer[];
  shipments: Shipment[];
  notifications: Notification[];
  activities: Activity[];
  supportMessages: SupportMessage[];
  adminProfile: AdminProfile;
  session: Session | null;
  currentCustomer: Customer | null;
  authReady: boolean;

  // Auth
  customerSignup: (data: {
    fullName: string; email: string; phone: string; password: string;
    address: string; country: string; state: string; city: string;
  }) => Promise<AuthResult>;
  customerLogin: (email: string, password: string) => Promise<AuthResult>;
  adminLogin: (email: string, password: string) => Promise<AuthResult>;
  updateAdminProfile: (patch: Partial<Pick<AdminProfile, 'phone'>>) => Promise<{ success: boolean; error?: string }>;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Lookups
  findShipmentById: (id: string) => Shipment | undefined;
  findShipmentByTracking: (trackingNumber: string) => Shipment | undefined;
  findCustomerById: (id: string) => Customer | undefined;

  // Shipments
  getCustomerShipments: (customerId: string) => Shipment[];
  shipmentsByCustomer: (customerId: string) => Shipment[];
  createAdminShipment: (data: {
    customerEmail: string;
    sender: Address;
    recipient: Address;
    packageType: PackageType;
    weight: number;
    dimensions: string;
    packageCount: number;
    shippingMethod: ShippingMethod;
    instructions?: string;
    cost: number;
    estimatedDelivery: string;
    origin?: string;
    destination?: string;
    currency?: string;
    images: File[];
  }) => Promise<{ success: boolean; shipmentId?: string; trackingNumber?: string; error?: string }>;
  updateShipmentStatus: (shipmentId: string, newStatus: ShipmentStatus, location?: string) => Promise<Shipment | null>;
  updateShipmentLocation: (shipmentId: string, data: {
    destination: string;
    recipientAddress: string;
    currentLocation: string;
  }) => Shipment | null;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllCustomerNotificationsRead: (customerId: string) => void;
  getCustomerNotifications: (customerId: string) => Notification[];
  notificationsByCustomer: (customerId: string) => Notification[];
  unreadCount: (customerId: string) => number;

  // Support inbox
  getSupportMessages: (customerId: string) => SupportMessage[];
  sendSupportMessage: (data: { customerId: string; subject: string; body: string; shipmentId?: string }) => Promise<{ success: boolean; error?: string }>;
  markSupportMessageRead: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Profile / customer mutations
  updateCustomerProfile: (customerId: string, patch: Partial<Omit<Customer, 'id' | 'password' | 'createdAt'>>) => { success: boolean; error?: string };
  changeCustomerPassword: (customerId: string, currentPassword: string, newPassword: string) => { success: boolean; error?: string };

  // Helpers
  recentActivity: (limit?: number) => Activity[];
  shipmentStatsByCustomer: (customerId: string) => { total: number; active: number; delivered: number; pending: number; exception: number };
  adminStats: () => {
    totalUsers: number;
    totalShipments: number;
    active: number;
    pending: number;
    inTransit: number;
    outForDelivery: number;
    delivered: number;
    exception: number;
    revenue: number;
    topDestinations: { name: string; count: number }[];
    monthlyVolume: { month: string; count: number; shipments: number; revenue: number; customers: number }[];
    deliveryPerformance: { onTime: number; late: number; rate: number };
    successRate: number;
    exceptionRate: number;
    avgDeliveryDays: number;
  };
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [, setDataLoading] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const authRequestId = useRef(0);

  useEffect(() => {
    setState(defaultState);
    setHasHydrated(true);

    const client = getSupabaseBrowser();
    if (!client) {
      setAuthReady(true);
      return;
    }

    let active = true;
    const syncAuth = async (user: User | null) => {
      const requestId = ++authRequestId.current;
      if (!user) {
        if (active) {
          setSession(null);
          setAuthReady(true);
        }
        return;
      }

      try {
        const profile = await fetchAuthProfile(client, user.id);
        if (!active || requestId !== authRequestId.current) return;
        setSession({
          userId: profile.id,
          role: profile.role,
          createdAt: profile.created_at,
        });
        setDataLoading(true);
        const snapshot = await fetchAppData(client);
        if (!active || requestId !== authRequestId.current) return;
        setState((prev) => ({
          ...prev,
          customers: snapshot.customers,
          shipments: snapshot.shipments,
          notifications: snapshot.notifications,
          activities: snapshot.activities,
          supportMessages: snapshot.supportMessages,
          adminProfile: snapshot.adminProfile ?? (profile.role === 'admin' ? profileToAdmin(profile) : prev.adminProfile),
        }));
      } catch {
        if (!active || requestId !== authRequestId.current) return;
        setSession(null);
        setTimeout(() => {
          void client.auth.signOut();
        }, 0);
      } finally {
        if (active && requestId === authRequestId.current) {
          setDataLoading(false);
          setAuthReady(true);
        }
      }
    };

    const initializeAuth = async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      await syncAuth(data.session?.user ?? null);
    };
    void initializeAuth();

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        void syncAuth(nextSession?.user ?? null);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hasHydrated]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  // The supabase_realtime publication already streams shipments, tracking
  // events, notifications, activities and support messages. While a session is
  // active we subscribe and re-pull the (RLS-scoped) snapshot whenever a row
  // changes, so every signed-in surface — admin consoles and the customer's
  // /track page alike — updates on its own, without a reload or manual refetch.
  //
  // The re-pull is deliberately debounced: a single admin status change writes
  // the shipments row plus several tracking_events rows plus a notification, and
  // each one fires its own event. Collapsing them into one refresh keeps the UI
  // from flickering through intermediate states.
  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client || !session) return;

    let refreshScheduled = false;
    const refreshSnapshot = async () => {
      refreshScheduled = false;
      try {
        const snapshot = await fetchAppData(client);
        setState((prev) => ({
          ...prev,
          customers: snapshot.customers,
          shipments: snapshot.shipments,
          notifications: snapshot.notifications,
          activities: snapshot.activities,
          supportMessages: snapshot.supportMessages,
          adminProfile: snapshot.adminProfile ?? prev.adminProfile,
        }));
      } catch {
        // Transient network errors must not tear down the live session.
      }
    };
    const scheduleRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      window.setTimeout(() => void refreshSnapshot(), 300);
    };

    const channel = client
      .channel('app-state-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_events' }, scheduleRefresh)
      // Product/packing images live in their own table, so an upload only
      // reaches every other open device once we subscribe to it as well.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipment_images' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, scheduleRefresh)
      .subscribe((state) => {
        // Re-pull as soon as the socket (re)connects so anything that changed
        // while this device was offline or backgrounded is picked up.
        if (state === 'SUBSCRIBED') scheduleRefresh();
      });

    // Catches up immediately when the operator returns to this tab — the case
    // where a backgrounded tab is most visibly out of date.
    const onWake = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
      window.removeEventListener('focus', onWake);
      void client.removeChannel(channel);
    };
  }, [session]);

  const currentCustomer = useMemo(
    () => (session?.role === 'customer' ? state.customers.find((c) => c.id === session.userId) ?? null : null),
    [session, state.customers],
  );

  const addActivity = useCallback((prev: PersistedState, act: Omit<Activity, 'id' | 'timestamp'>): PersistedState => {
    const newAct: Activity = { id: uid('act'), timestamp: now(), ...act };
    return { ...prev, activities: [newAct, ...prev.activities].slice(0, 500) };
  }, []);

  const customerSignup: AppStateContextValue['customerSignup'] = async (data) => {
    const client = getSupabaseBrowser();
    if (!client) return { success: false, error: 'Supabase is not configured.' };

    const email = data.email.trim().toLowerCase();
    const { data: authData, error } = await client.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          role: 'customer',
          full_name: data.fullName.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          country: data.country.trim(),
          state: data.state.trim(),
          city: data.city.trim(),
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase().includes('already registered')
        ? 'An account with this email already exists.'
        : error.message;
      return { success: false, error: message };
    }

    if (!authData.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }

    if (!authData.user) {
      return { success: false, error: 'Supabase did not return the new account user.' };
    }

    try {
      const profile = await fetchAuthProfile(client, authData.user.id);
      setSession({ userId: profile.id, role: profile.role, createdAt: profile.created_at });
      return { success: true };
    } catch (profileError) {
      await client.auth.signOut();
      return { success: false, error: authErrorMessage(profileError, 'Your account profile could not be loaded.') };
    }
  };

  const customerLogin: AppStateContextValue['customerLogin'] = async (email, password) => {
    const client = getSupabaseBrowser();
    if (!client) return { success: false, error: 'Supabase is not configured.' };

    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      return { success: false, error: error?.message ?? 'Invalid email or password.' };
    }

    try {
      const profile = await fetchAuthProfile(client, data.user.id);
      if (profile.role !== 'customer') {
        await client.auth.signOut();
        return { success: false, error: 'This account is not authorized for the customer portal.' };
      }
      setSession({ userId: profile.id, role: profile.role, createdAt: profile.created_at });
      return { success: true };
    } catch (profileError) {
      await client.auth.signOut();
      return { success: false, error: authErrorMessage(profileError, 'Your account profile could not be loaded.') };
    }
  };

  const adminLogin: AppStateContextValue['adminLogin'] = async (email, password) => {
    const client = getSupabaseBrowser();
    if (!client) return { success: false, error: 'Supabase is not configured.' };

    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      return { success: false, error: error?.message ?? 'Invalid admin credentials.' };
    }

    try {
      const profile = await fetchAuthProfile(client, data.user.id);
      if (profile.role !== 'admin') {
        await client.auth.signOut();
        return { success: false, error: 'This account is not authorized for the operations console.' };
      }
      setSession({ userId: profile.id, role: profile.role, createdAt: profile.created_at });
      setState((prev) => ({
        ...prev,
        adminProfile: profileToAdmin(profile),
      }));
      setState((prev) => addActivity(prev, {
        type: 'admin_logged_in',
        actor: profile.full_name,
        action: 'Admin logged in to dashboard',
      }));
      return { success: true };
    } catch (profileError) {
      await client.auth.signOut();
      return { success: false, error: authErrorMessage(profileError, 'The admin profile could not be loaded.') };
    }
  };

  const updateAdminProfile: AppStateContextValue['updateAdminProfile'] = async (patch) => {
    const client = getSupabaseBrowser();
    if (!client) return { success: false, error: 'Supabase is not configured.' };
    if (session?.role !== 'admin') return { success: false, error: 'Only an administrator can update this profile.' };

    const phone = patch.phone?.trim() ?? '';
    const { data, error } = await client
      .from('profiles')
      .update({ phone, last_active: now() })
      .eq('id', session.userId)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'The admin profile could not be updated.' };
    }

    const adminProfile = profileToAdmin(data);
    setState((prev) => addActivity({ ...prev, adminProfile }, {
      type: 'admin_profile_updated',
      actor: adminProfile.name ?? 'Administrator',
      action: phone ? 'Admin phone number updated' : 'Admin phone number removed',
    }));
    return { success: true };
  };

  const changeAdminPassword: AppStateContextValue['changeAdminPassword'] = async (currentPassword, newPassword) => {
    const client = getSupabaseBrowser();
    if (!client) return { success: false, error: 'Supabase is not configured.' };
    if (session?.role !== 'admin') return { success: false, error: 'Only an administrator can change this password.' };
    if (newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters.' };
    if (newPassword === currentPassword) return { success: false, error: 'New password must be different from the current password.' };
    if (!state.adminProfile.email) return { success: false, error: 'Your admin email is unavailable.' };

    const { error: signInError } = await client.auth.signInWithPassword({
      email: state.adminProfile.email,
      password: currentPassword,
    });
    if (signInError) return { success: false, error: 'Current password is incorrect.' };

    const { error: updateError } = await client.auth.updateUser({ password: newPassword });
    if (updateError) return { success: false, error: updateError.message };

    setState((prev) => addActivity(prev, {
      type: 'admin_password_changed',
      actor: prev.adminProfile.name ?? 'Administrator',
      action: 'Admin password changed',
    }));
    return { success: true };
  };

  const logout = async () => {
    const client = getSupabaseBrowser();
    try {
      if (client) await client.auth.signOut();
    } finally {
      setSession(null);
    }
  };

  const findShipmentById = (id: string) => state.shipments.find((s) => s.id === id);
  const findShipmentByTracking = (trackingNumber: string) =>
    state.shipments.find((s) => s.trackingNumber.toLowerCase() === trackingNumber.trim().toLowerCase());
  const findCustomerById = (id: string) => state.customers.find((c) => c.id === id);

  const getCustomerShipments = (customerId: string) =>
    state.shipments
      .filter((s) => s.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const shipmentsByCustomer = getCustomerShipments;

  const createAdminShipment: AppStateContextValue['createAdminShipment'] = async (data) => {
    const client = getSupabaseBrowser();
    if (!client) return { success: false, error: 'Supabase is not configured.' };
    if (session?.role !== 'admin') return { success: false, error: 'Only an administrator can create shipments.' };
    const customer = state.customers.find((item) => item.email.toLowerCase() === data.customerEmail.trim().toLowerCase());
    if (!customer) return { success: false, error: 'No registered customer was found for that email.' };
    if (data.images.length < 1 || data.images.length > 3) return { success: false, error: 'Upload between 1 and 3 shipment images.' };

    const trackingNumber = randomTrackingNumber();
    const origin = data.origin ?? `${data.sender.city}, ${data.sender.country}`;
    const destination = data.destination ?? `${data.recipient.city}, ${data.recipient.country}`;
    const { data: shipmentRow, error: shipmentError } = await client
      .from('shipments')
      .insert({
        tracking_number: trackingNumber,
        customer_id: customer.id,
        sender: addressToJson(data.sender),
        recipient: addressToJson(data.recipient),
        origin,
        destination,
        status: 'Order Created',
        current_location: origin,
        package_type: data.packageType,
        weight: data.weight,
        dimensions: data.dimensions,
        package_count: data.packageCount,
        shipping_method: data.shippingMethod,
        cost: data.cost,
        currency: data.currency ?? 'USD',
        instructions: data.instructions?.trim() || null,
        estimated_delivery: data.estimatedDelivery,
      })
      .select('*')
      .single();
    if (shipmentError || !shipmentRow) return { success: false, error: shipmentError?.message ?? 'The shipment could not be created.' };

    const created = shipmentRow.created_at;
    const { error: eventError } = await client.from('tracking_events').insert({
      shipment_id: shipmentRow.id,
      status: 'Order Created',
      location: data.sender.city,
      event_date: fmtDateOnly(created),
      event_time: fmtTimeOnly(created),
      occurred_at: created,
      description: makeStatusDescription('Order Created', data.sender.city, data.shippingMethod),
      state: 'current',
    });
    if (eventError) return { success: false, error: eventError.message };

    const uploadedPaths: string[] = [];
    for (const [index, file] of data.images.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${shipmentRow.id}/${Date.now()}-${index}-${safeName}`;
      const { error: uploadError } = await client.storage.from('shipment-images').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) return { success: false, error: `Image upload failed: ${uploadError.message}` };
      uploadedPaths.push(path);
      const { data: imageData } = client.storage.from('shipment-images').getPublicUrl(path);
      const { error: imageError } = await client.from('shipment_images').insert({
        shipment_id: shipmentRow.id,
        storage_path: path,
        public_url: imageData.publicUrl,
        sort_order: index,
      });
      if (imageError) return { success: false, error: imageError.message };
    }

    await client.from('notifications').insert({
      customer_id: customer.id,
      type: 'shipment_created',
      title: 'Shipment Created',
      message: `Your shipment ${trackingNumber} has been created. Track it from your account or use the public tracking link.`,
      shipment_id: shipmentRow.id,
      tracking_number: trackingNumber,
    });
    await client.from('support_messages').insert({
      customer_id: customer.id,
      sender_id: session.userId,
      sender_role: 'admin',
      subject: 'Your shipment has been created',
      body: `Shipment ${trackingNumber} is now available. You can track it from your ArcBest account.`,
      shipment_id: shipmentRow.id,
    });
    await client.from('activities').insert({
      type: 'shipment_created',
      actor: state.adminProfile.name ?? 'Administrator',
      action: `Shipment ${trackingNumber} created for ${customer.email}`,
      customer_id: customer.id,
      shipment_id: shipmentRow.id,
      reference_id: trackingNumber,
    });

    // The shipment, its first scan and its images now all exist, so anyone who
    // already has this tracking number open (a shared link, say) sees the full
    // result — pictures included — straight away.
    void broadcastShipmentChange(client, trackingNumber, 'created');

    if (typeof window !== 'undefined') {
      void fetch('/api/notifications/shipment-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.email,
          customerName: customer.fullName,
          trackingNumber,
          trackingUrl: `${window.location.origin}/track/${trackingNumber}`,
          shipmentId: shipmentRow.id,
        }),
      });
    }

    const snapshot = await fetchAppData(client);
    setState((prev) => ({ ...prev, customers: snapshot.customers, shipments: snapshot.shipments, notifications: snapshot.notifications, activities: snapshot.activities, supportMessages: snapshot.supportMessages }));
    return { success: true, shipmentId: shipmentRow.id, trackingNumber };
  };


  const updateShipmentStatus: AppStateContextValue['updateShipmentStatus'] = async (shipmentId, newStatus, locationOverride) => {
    const shipment = state.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    const timestamp = now();
    const currentIdx = STATUS_ORDER.indexOf(shipment.status);
    const newIdx = STATUS_ORDER.indexOf(newStatus);
    const currentLocation = locationOverride ?? shipment.currentLocation;
    const movingBackwards = newIdx >= 0 && currentIdx >= 0 && newIdx < currentIdx;

    // Stamp exactly ONE row per status change so the timeline never shows the
    // same scan twice (the old code stamped *every* matching row, producing
    // the double "Arrived at Facility / Chicago / 05:55 PM" entry).
    let newEvents = shipment.trackingEvents.slice();
    const isExceptionTarget = newStatus === 'Exception';

    // 1 · Find the row to stamp: first unstamped row of the target stage,
    //     else a stamped row of the target stage we can refresh, else the
    //     first universally-unstamped row after the current position.
    let targetIdx = newEvents.findIndex((ev) => ev.status === newStatus && !hasStamp(ev));
    if (targetIdx < 0) {
      targetIdx = newEvents.findIndex((ev) => ev.status === newStatus && hasStamp(ev));
    }
    if (targetIdx < 0 && !isExceptionTarget) {
      // No row left for this stage (already visited) — append a fresh scan so
      // the new timestamp has its own row instead of rewriting an old one.
      const loc = locationOverride ?? currentLocation;
      newEvents.push({
        id: uid('te'),
        status: newStatus,
        location: loc,
        date: fmtDateOnly(timestamp),
        time: fmtTimeOnly(timestamp),
        description: makeStatusDescription(newStatus, loc, shipment.shippingMethod),
        state: 'current',
      });
      targetIdx = newEvents.length - 1;
    }
    if (isExceptionTarget && targetIdx < 0) {
      // Exception is a side branch with no guaranteed template row.
      newEvents.push({
        id: uid('te'),
        status: 'Exception',
        location: locationOverride ?? currentLocation,
        date: fmtDateOnly(timestamp),
        time: fmtTimeOnly(timestamp),
        description: 'Delivery exception detected. Operations team notified.',
        state: 'current',
      });
      targetIdx = newEvents.length - 1;
    }

    if (targetIdx >= 0) {
      const ev = newEvents[targetIdx];
      const loc = locationOverride ?? ev.location;
      newEvents[targetIdx] = {
        ...ev,
        location: loc,
        date: fmtDateOnly(timestamp),
        time: fmtTimeOnly(timestamp),
        description: ev.status === 'Exception'
          ? 'Delivery exception detected. Operations team notified.'
          : makeStatusDescription(ev.status, loc, shipment.shippingMethod),
        state: 'current',
      };
    }

    // 2 · Only when moving FORWARD, back-fill skipped intermediate stages so
    //     the timeline has no gaps. Never touch them on a correction —
    //     otherwise a Delivered → In Transit fix would rewrite the old
    //     Arrived/Out-for-Delivery scans with fresh "now" stamps.
    if (!movingBackwards && !isExceptionTarget) {
      newEvents = newEvents.map((ev, i) => {
        if (i === targetIdx) return ev;
        const evIdx = STATUS_ORDER.indexOf(ev.status);
        if (!hasStamp(ev) && evIdx < newIdx && evIdx > currentIdx) {
          const offsetMs = (evIdx - currentIdx) * 3600_000;
          const d = new Date(new Date(timestamp).getTime() - (newIdx - evIdx) * 3600_000 - offsetMs);
          const iso = d.toISOString();
          const loc = locationOverride ?? ev.location;
          return {
            ...ev,
            location: loc,
            date: fmtDateOnly(iso),
            time: fmtTimeOnly(iso),
            description: makeStatusDescription(ev.status, loc, shipment.shippingMethod),
            state: 'completed' as const,
          };
        }
        return ev;
      });
    }
    newEvents = applyTrackingStates(newEvents, newStatus);

    const updated: Shipment = {
      ...shipment,
      status: newStatus,
      currentLocation,
      lastUpdated: timestamp,
      trackingEvents: newEvents,
    };

    const client = getSupabaseBrowser();
    const insertedEventIds: Record<string, string> = {};
    const dbActivities: Activity[] = [];
    let dbNotification: Notification | null = null;

    if (client && session?.role === 'admin') {
      // 1 · Shipment row → the public track page reads this through /api/track.
      const { error: shipmentWriteError } = await client
        .from('shipments')
        .update({ status: newStatus, current_location: currentLocation, last_updated: timestamp })
        .eq('id', shipmentId);
      if (shipmentWriteError) return null;

      // 2 · Mirror the final in-memory timeline onto tracking_events:
      //      • rows already in the DB are updated in place — never re-inserted,
      //        so a reload can never show the same scan twice,
      //      • freshly appended rows are inserted and their temp ids swapped
      //        for the real ids (keeps local state DB-true for the next op),
      //      • rows the timeline dedupe collapsed are deleted.
      const originalIds = new Set(shipment.trackingEvents.map((event) => event.id));
      const finalIds = new Set(updated.trackingEvents.map((event) => event.id));
      const eventRow = (event: TrackingEvent) => ({
        status: event.status,
        location: event.location,
        event_date: event.date,
        event_time: event.time,
        description: event.description,
        state: event.state,
      });
      for (const event of updated.trackingEvents) {
        if (originalIds.has(event.id)) {
          const { error: eventWriteError } = await client.from('tracking_events').update(eventRow(event)).eq('id', event.id);
          if (eventWriteError) return null;
        } else {
          const { data: insertedEvent, error: eventInsertError } = await client
            .from('tracking_events')
            .insert({ shipment_id: shipmentId, occurred_at: timestamp, ...eventRow(event) })
            .select('*')
            .single();
          if (eventInsertError || !insertedEvent) return null;
          insertedEventIds[event.id] = insertedEvent.id;
        }
      }
      const idsToDelete = [...originalIds].filter((id) => !finalIds.has(id));
      if (idsToDelete.length) {
        const { error: deleteError } = await client.from('tracking_events').delete().in('id', idsToDelete);
        if (deleteError) return null;
      }

      // 3 · Audit trail + customer notification. Best-effort: a failed
      //    side-effect must never roll back the status change itself.
      //
      //    Announce last: by now the row writes have committed, so anyone
      //    listening on the public tracking page re-reads fresh data instead of
      //    racing this broadcast. The database trigger covers the same change;
      //    this just removes the round-trip delay.
      void broadcastShipmentChange(client, shipment.trackingNumber, 'status');

      const addDbActivity = async (type: ActivityType, actor: string, action: string, details?: string): Promise<Activity | null> => {
        const { data, error } = await client
          .from('activities')
          .insert({
            type,
            actor,
            action,
            shipment_id: updated.id,
            reference_id: updated.trackingNumber,
            details: details ?? undefined,
          })
          .select('*')
          .single();
        if (error || !data) {
          console.warn('Status saved, but the activity could not be logged:', error?.message ?? 'unknown');
          return null;
        }
        return activityToModel(data);
      };

      const statusActivity = await addDbActivity('shipment_status_changed', 'Admin', `Shipment ${shipment.trackingNumber} updated to ${newStatus}`, `from: ${shipment.status} → to: ${newStatus}`);
      if (statusActivity) dbActivities.push(statusActivity);
      const eventActivity = await addDbActivity('tracking_event_added', 'Admin', `Tracking event added to ${shipment.trackingNumber} (${newStatus})`);
      if (eventActivity) dbActivities.push(eventActivity);
      if (newStatus === 'Delivered') {
        const deliveredActivity = await addDbActivity('shipment_delivered', 'System', `Shipment ${shipment.trackingNumber} delivered successfully`);
        if (deliveredActivity) dbActivities.push(deliveredActivity);
      }

      const notifType = STATUS_NOTIF_MAP[newStatus as Exclude<ShipmentStatus, 'Order Created'>];
      if (notifType) {
        const { data: notifRow, error: notifError } = await client
          .from('notifications')
          .insert({
            customer_id: shipment.customerId,
            type: notifType,
            title: STATUS_NOTIF_TITLE[newStatus as Exclude<ShipmentStatus, 'Order Created'>],
            message: `Shipment ${shipment.trackingNumber} status updated to ${newStatus}.`,
            shipment_id: updated.id,
            tracking_number: shipment.trackingNumber,
          })
          .select('*')
          .single();
        if (notifError || !notifRow) {
          console.warn('Status saved, but the customer notification could not be created:', notifError?.message ?? 'unknown');
        } else {
          dbNotification = notificationToModel(notifRow);
        }
      }
    }

    // Freshly inserted scans get their real ids so the flash ring on the
    // landed scan keeps working and later updates match DB rows by id.
    if (Object.keys(insertedEventIds).length) {
      updated.trackingEvents = updated.trackingEvents.map((event) => {
        const realId = insertedEventIds[event.id];
        return realId ? { ...event, id: realId } : event;
      });
    }

    setState((prev) => ({
      ...prev,
      shipments: prev.shipments.map((s) => (s.id === shipmentId ? updated : s)),
      activities: [...dbActivities, ...prev.activities].slice(0, 500),
      notifications: dbNotification ? [dbNotification, ...prev.notifications] : prev.notifications,
    }));

    return updated;
  };

  const updateShipmentLocation: AppStateContextValue['updateShipmentLocation'] = (shipmentId, data) => {
    const shipment = state.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    const destination = data.destination.trim();
    const recipientAddress = data.recipientAddress.trim();
    const currentLocation = data.currentLocation.trim();
    if (!destination || !recipientAddress || !currentLocation) return null;

    const timestamp = now();
    const updated: Shipment = {
      ...shipment,
      destination,
      recipient: { ...shipment.recipient, address: recipientAddress },
      currentLocation,
      lastUpdated: timestamp,
      trackingEvents: shipment.trackingEvents.map((event) =>
        event.state === "current" ? { ...event, location: currentLocation } : event,
      ),
    };

    const client = getSupabaseBrowser();
    if (client && session?.role === 'admin') {
      void client.from('shipments').update({ destination, recipient: addressToJson(updated.recipient), current_location: currentLocation, last_updated: timestamp }).eq('id', shipmentId);
      // Tell any open tracking page that the map/route just moved.
      void broadcastShipmentChange(client, shipment.trackingNumber, 'location');
    }

    setState((prev) => {
      let next: PersistedState = {
        ...prev,
        shipments: prev.shipments.map((s) => (s.id === shipmentId ? updated : s)),
      };
      next = addActivity(next, {
        type: 'tracking_event_added',
        actor: 'Admin',
        action: `Shipment ${shipment.trackingNumber} location updated`,
        shipmentId: updated.id,
        referenceId: shipment.trackingNumber,
        details: `Current location: ${currentLocation}`,
      });
      return next;
    });

    return updated;
  };

  const markNotificationRead = (id: string) => {
    const client = getSupabaseBrowser();
    if (client) void client.from('notifications').update({ read: true }).eq('id', id);
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllCustomerNotificationsRead = (customerId: string) => {
    const client = getSupabaseBrowser();
    if (client) void client.from('notifications').update({ read: true }).eq('customer_id', customerId).eq('read', false);
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.customerId === customerId && !n.read ? { ...n, read: true } : n,
      ),
    }));
  };

  const getSupportMessages = (customerId: string) =>
    state.supportMessages
      .filter((message) => message.customerId === customerId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const sendSupportMessage: AppStateContextValue['sendSupportMessage'] = async (data) => {
    const client = getSupabaseBrowser();
    if (!client || !session) return { success: false, error: 'Sign in to send a message.' };
    const subject = data.subject.trim();
    const body = data.body.trim();
    if (!subject || !body) return { success: false, error: 'Add a subject and message.' };
    const senderRole = session.role === 'admin' ? 'admin' : 'customer';
    const { data: row, error } = await client.from('support_messages').insert({
      customer_id: data.customerId,
      sender_id: session.userId,
      sender_role: senderRole,
      subject,
      body,
      shipment_id: data.shipmentId ?? null,
    }).select('*').single();
    if (error || !row) return { success: false, error: error?.message ?? 'Message could not be sent.' };
    setState((prev) => ({ ...prev, supportMessages: [...prev.supportMessages, {
      id: row.id, customerId: row.customer_id, senderId: row.sender_id, senderRole: row.sender_role,
      subject: row.subject, body: row.body, shipmentId: row.shipment_id ?? undefined,
      readAt: row.read_at ?? undefined, createdAt: row.created_at,
    }] }));
    return { success: true };
  };

  const markSupportMessageRead: AppStateContextValue['markSupportMessageRead'] = async (id) => {
    const client = getSupabaseBrowser();
    if (client) {
      const { error } = await client.from('support_messages').update({ read_at: now() }).eq('id', id);
      if (error) return { success: false, error: error.message };
    }
    setState((prev) => ({ ...prev, supportMessages: prev.supportMessages.map((message) => message.id === id ? { ...message, readAt: now() } : message) }));
    return { success: true };
  };

  const getCustomerNotifications = (customerId: string) =>
    state.notifications
      .filter((n) => n.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const notificationsByCustomer = getCustomerNotifications;

  const unreadCount = (customerId: string) =>
    state.notifications.filter((n) => n.customerId === customerId && !n.read).length;

  const updateCustomerProfile: AppStateContextValue['updateCustomerProfile'] = (customerId, patch) => {
    const cust = state.customers.find((c) => c.id === customerId);
    if (!cust) return { success: false, error: 'Customer not found.' };
    // Guard: prevent email collisions
    if (patch.email && patch.email.toLowerCase() !== cust.email.toLowerCase()) {
      const taken = state.customers.some(
        (c) => c.id !== customerId && c.email.toLowerCase() === patch.email!.toLowerCase(),
      );
      if (taken) return { success: false, error: 'That email is already in use.' };
    }
    setState((prev) => {
      let next: PersistedState = {
        ...prev,
        customers: prev.customers.map((c) => (c.id === customerId ? { ...c, ...patch, lastActive: now() } : c)),
      };
      next = addActivity(next, {
        type: 'customer_updated',
        actor: (session?.role === 'admin' ? 'Admin' : cust.fullName) ?? 'Customer',
        action: `Customer profile updated for ${cust.fullName}`,
        customerId,
        referenceId: customerId,
      });
      return next;
    });
    return { success: true };
  };

  const changeCustomerPassword: AppStateContextValue['changeCustomerPassword'] = (customerId, currentPassword, newPassword) => {
    const cust = state.customers.find((c) => c.id === customerId);
    if (!cust) return { success: false, error: 'Customer not found.' };
    if (cust.password !== currentPassword) return { success: false, error: 'Current password is incorrect.' };
    if (newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters.' };
    if (newPassword === currentPassword) return { success: false, error: 'New password must be different from current.' };
    setState((prev) => {
      let next: PersistedState = {
        ...prev,
        customers: prev.customers.map((c) => (c.id === customerId ? { ...c, password: newPassword, lastActive: now() } : c)),
      };
      next = addActivity(next, {
        type: 'customer_updated',
        actor: cust.fullName,
        action: `Password changed for ${cust.fullName}`,
        customerId,
        referenceId: customerId,
      });
      return next;
    });
    return { success: true };
  };

  const recentActivity = (limit = 20) =>
    [...state.activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

  const shipmentStatsByCustomer = (customerId: string) => {
    const list = state.shipments.filter((s) => s.customerId === customerId);
    return {
      total: list.length,
      active: list.filter((s) =>
        ['Confirmed', 'Picked Up', 'In Transit', 'Arrived at Facility', 'Out for Delivery'].includes(s.status),
      ).length,
      delivered: list.filter((s) => s.status === 'Delivered').length,
      pending: list.filter((s) => s.status === 'Order Created').length,
      exception: list.filter((s) => s.status === 'Exception').length,
    };
  };

  const adminStats: AppStateContextValue['adminStats'] = () => {
    const shipments = state.shipments;
    const totalUsers = state.customers.length;
    const totalShipments = shipments.length;
    const active = shipments.filter((s) => ['Confirmed', 'Picked Up', 'In Transit', 'Arrived at Facility', 'Out for Delivery'].includes(s.status)).length;
    const pending = shipments.filter((s) => s.status === 'Order Created').length;
    const inTransit = shipments.filter((s) => s.status === 'In Transit').length;
    const outForDelivery = shipments.filter((s) => s.status === 'Out for Delivery').length;
    const delivered = shipments.filter((s) => s.status === 'Delivered').length;
    const exception = shipments.filter((s) => s.status === 'Exception').length;
    const revenue = shipments.reduce((sum, s) => sum + s.cost, 0);

    const destCounts = new Map<string, number>();
    shipments.forEach((s) => {
      const d = s.destination.split(',')[0].trim();
      destCounts.set(d, (destCounts.get(d) ?? 0) + 1);
    });
    const topDestinations = Array.from(destCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCountMap = new Map<string, number>();
    const monthlyRevMap = new Map<string, number>();
    const monthlyCustMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const k = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyCountMap.set(k, 0);
      monthlyRevMap.set(k, 0);
      monthlyCustMap.set(k, 0);
    }
    shipments.forEach((s) => {
      const d = new Date(s.createdAt);
      const k = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyCountMap.has(k)) {
        monthlyCountMap.set(k, (monthlyCountMap.get(k) ?? 0) + 1);
        monthlyRevMap.set(k, (monthlyRevMap.get(k) ?? 0) + s.cost);
      }
    });
    state.customers.forEach((c) => {
      const d = new Date(c.createdAt);
      const k = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyCustMap.has(k)) monthlyCustMap.set(k, (monthlyCustMap.get(k) ?? 0) + 1);
    });
    const monthlyVolume = Array.from(monthlyCountMap.entries()).map(([month, count]) => ({
      month,
      count,
      shipments: count,
      revenue: monthlyRevMap.get(month) ?? 0,
      customers: monthlyCustMap.get(month) ?? 0,
    }));

    const deliveredShips = shipments.filter((s) => s.status === 'Delivered');
    const onTime = deliveredShips.filter((s) => new Date(s.lastUpdated) <= new Date(s.estimatedDelivery)).length;
    const late = deliveredShips.length - onTime;
    const rate = deliveredShips.length ? Math.round((onTime / deliveredShips.length) * 100) : 94;

    const successRate = rate;
    const exceptionRate = totalShipments ? Math.round((exception / totalShipments) * 1000) / 10 : 2;
    let avgDeliveryDays = 4;
    if (deliveredShips.length) {
      const totalDays = deliveredShips.reduce((sum, s) => {
        const diffMs = new Date(s.lastUpdated).getTime() - new Date(s.createdAt).getTime();
        const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        return sum + days;
      }, 0);
      avgDeliveryDays = Math.round((totalDays / deliveredShips.length) * 10) / 10;
    }

    return {
      totalUsers, totalShipments, active, pending, inTransit, outForDelivery,
      delivered, exception, revenue, topDestinations, monthlyVolume,
      deliveryPerformance: { onTime, late: Math.max(late, 1), rate },
      successRate,
      exceptionRate,
      avgDeliveryDays,
    };
  };

  const value: AppStateContextValue = {
    customers: state.customers,
    shipments: state.shipments,
    notifications: state.notifications,
    activities: state.activities,
    supportMessages: state.supportMessages,
    adminProfile: state.adminProfile,
    session,
    currentCustomer,
    authReady,
    customerSignup,
    customerLogin,
    adminLogin,
    updateAdminProfile,
    changeAdminPassword,
    logout,
    findShipmentById,
    findShipmentByTracking,
    findCustomerById,
    getCustomerShipments,
    shipmentsByCustomer,
    createAdminShipment,
    updateShipmentStatus,
    updateShipmentLocation,
    markNotificationRead,
    markAllCustomerNotificationsRead,
    getCustomerNotifications,
    notificationsByCustomer,
    unreadCount,
    getSupportMessages,
    sendSupportMessage,
    markSupportMessageRead,
    updateCustomerProfile,
    changeCustomerPassword,
    recentActivity,
    shipmentStatsByCustomer,
    adminStats,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
