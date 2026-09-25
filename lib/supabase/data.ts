import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type {
  Activity,
  Address,
  Notification,
  Shipment,
  ShipmentStatus,
  ShipmentImage,
  SupportMessage,
  TrackingEvent,
} from '@/lib/types';
import {
  activityToModel,
  addressToJson,
  notificationToModel,
  profileToAdmin,
  profileToCustomer,
  shipmentToModel,
  supportMessageToModel,
} from './mappers';

export type SupabaseBrowser = SupabaseClient<Database>;

type ShipmentWithEvents = Database['public']['Tables']['shipments']['Row'] & {
  tracking_events: Database['public']['Tables']['tracking_events']['Row'][];
  shipment_images: Database['public']['Tables']['shipment_images']['Row'][];
};

export interface AppDataSnapshot {
  customers: ReturnType<typeof profileToCustomer>[];
  adminProfile: ReturnType<typeof profileToAdmin> | null;
  shipments: Shipment[];
  notifications: Notification[];
  activities: Activity[];
  supportMessages: SupportMessage[];
}

/**
 * One round-trip for the whole app snapshot.
 * RLS decides what each caller is allowed to see, so this is safe to run
 * for both customers (own rows) and admins (everything).
 */
export async function fetchAppData(client: SupabaseBrowser): Promise<AppDataSnapshot> {
  const [profiles, shipments, notifications, activities, supportMessages] = await Promise.all([
    client.from('profiles').select('*').order('created_at', { ascending: false }),
    client.from('shipments').select('*, tracking_events(*), shipment_images(*)').order('created_at', { ascending: false }),
    client.from('notifications').select('*').order('created_at', { ascending: false }).limit(300),
    client.from('activities').select('*').order('created_at', { ascending: false }).limit(300),
    client.from('support_messages').select('*').order('created_at', { ascending: false }).limit(300),
  ]);

  const profileRows = profiles.data ?? [];
  const adminRow = profileRows.find((p) => p.role === 'admin') ?? null;

  return {
    customers: profileRows.filter((p) => p.role === 'customer').map(profileToCustomer),
    adminProfile: adminRow ? profileToAdmin(adminRow) : null,
    shipments: ((shipments.data ?? []) as ShipmentWithEvents[]).map((row) =>
      shipmentToModel(row, row.tracking_events ?? [], row.shipment_images ?? []),
    ),
    notifications: (notifications.data ?? []).map(notificationToModel),
    activities: (activities.data ?? []).map(activityToModel),
    supportMessages: (supportMessages.data ?? []).map(supportMessageToModel),
  };
}

export async function fetchShipments(client: SupabaseBrowser): Promise<Shipment[]> {
  const { data } = await client
    .from('shipments')
    .select('*, tracking_events(*), shipment_images(*)')
    .order('created_at', { ascending: false });
  return ((data ?? []) as ShipmentWithEvents[]).map((row) =>
    shipmentToModel(row, row.tracking_events ?? [], row.shipment_images ?? []),
  );
}

export async function fetchCustomers(client: SupabaseBrowser) {
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  return (data ?? []).map(profileToCustomer);
}

export async function fetchAdminProfile(client: SupabaseBrowser) {
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  return data ? profileToAdmin(data) : null;
}

export async function fetchProfileById(client: SupabaseBrowser, userId: string) {
  const { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ? profileToCustomer(data) : null;
}

/** Customer-side live query: only their own shipments (RLS enforced anyway). */
export async function fetchShipmentsByCustomer(
  client: SupabaseBrowser,
  customerId: string,
): Promise<Shipment[]> {
  const { data } = await client
    .from('shipments')
    .select('*, tracking_events(*), shipment_images(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  return ((data ?? []) as ShipmentWithEvents[]).map((row) =>
    shipmentToModel(row, row.tracking_events ?? [], row.shipment_images ?? []),
  );
}

export async function fetchNotificationsByCustomer(
  client: SupabaseBrowser,
  customerId: string,
): Promise<Notification[]> {
  const { data } = await client
    .from('notifications')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(notificationToModel);
}