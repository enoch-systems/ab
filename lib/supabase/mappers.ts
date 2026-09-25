import type { Database } from './database.types';
import type {
  Activity,
  ActivityType,
  AdminProfile,
  Address,
  Customer,
  Notification,
  NotificationType,
  PackageType,
  Shipment,
  ShipmentImage,
  ShipmentStatus,
  SupportMessage,
  ShippingMethod,
  TrackingEvent,
} from '@/lib/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ShipmentRow = Database['public']['Tables']['shipments']['Row'];
type ShipmentImageRow = Database['public']['Tables']['shipment_images']['Row'];
type SupportMessageRow = Database['public']['Tables']['support_messages']['Row'];
type TrackingEventRow = Database['public']['Tables']['tracking_events']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type ActivityRow = Database['public']['Tables']['activities']['Row'];

const EMPTY_ADDRESS: Address = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: '',
};

/** DB stores sender/recipient as jsonb — normalise back into an Address. */
function toAddress(value: unknown): Address {
  const raw = (value ?? {}) as Partial<Address>;
  return {
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    state: String(raw.state ?? ''),
    country: String(raw.country ?? ''),
  };
}

export const addressToJson = (address: Address) => ({
  name: address.name,
  phone: address.phone,
  email: address.email,
  address: address.address,
  city: address.city,
  state: address.state,
  country: address.country,
});

/**
 * Profiles are the single source of truth for customers and admins.
 * The password never leaves Supabase Auth, so `password` stays empty here.
 */
export function profileToCustomer(row: ProfileRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    password: '',
    address: row.address,
    country: row.country,
    state: row.state,
    city: row.city,
    createdAt: row.created_at,
    lastActive: row.last_active,
    accountStatus: row.account_status,
    company: row.company ?? undefined,
    defaultShippingMethod: (row.default_shipping_method ?? undefined) as ShippingMethod | undefined,
    defaultPackageType: (row.default_package_type ?? undefined) as PackageType | undefined,
    defaultInstructions: row.default_instructions ?? undefined,
    notifyEmail: row.notify_email,
    notifySms: row.notify_sms,
    notifyPush: row.notify_push,
    twoFactorEnabled: row.two_factor_enabled,
  };
}

export function profileToAdmin(row: ProfileRow): AdminProfile {
  return {
    name: row.full_name || null,
    username: row.username || null,
    email: row.email || null,
    phone: row.phone || null,
    role: 'admin',
    accountStatus: row.account_status,
    createdAt: row.created_at,
    lastActive: row.last_active,
  };
}

export function shipmentImageToModel(row: ShipmentImageRow): ShipmentImage {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function supportMessageToModel(row: SupportMessageRow): SupportMessage {
  return {
    id: row.id,
    customerId: row.customer_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    subject: row.subject,
    body: row.body,
    shipmentId: row.shipment_id ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function trackingEventToModel(row: TrackingEventRow): TrackingEvent {
  return {
    id: row.id,
    status: row.status,
    location: row.location,
    date: row.event_date,
    time: row.event_time,
    description: row.description,
    state: row.state,
  };
}

/** Shipments come back with their tracking_events embedded (see data.ts). */
export function shipmentToModel(
  row: ShipmentRow,
  events: TrackingEventRow[] = [],
  images: ShipmentImageRow[] = [],
): Shipment {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    customerId: row.customer_id ?? '',
    sender: toAddress(row.sender),
    recipient: toAddress(row.recipient),
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    currentLocation: row.current_location,
    packageType: row.package_type,
    weight: Number(row.weight),
    dimensions: row.dimensions,
    packageCount: row.package_count,
    shippingMethod: row.shipping_method,
    cost: Number(row.cost),
    currency: row.currency,
    instructions: row.instructions ?? undefined,
    estimatedDelivery: row.estimated_delivery ?? '',
    createdAt: row.created_at,
    lastUpdated: row.last_updated,
    trackingEvents: events
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(trackingEventToModel),
    images: images
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
      .map(shipmentImageToModel),
  };
}

export function notificationToModel(row: NotificationRow): Notification {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    shipmentId: row.shipment_id ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}

export function activityToModel(row: ActivityRow): Activity {
  return {
    id: row.id,
    type: row.type as ActivityType,
    actor: row.actor,
    action: row.action,
    referenceId: row.reference_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    shipmentId: row.shipment_id ?? undefined,
    details: row.details ?? undefined,
    timestamp: row.created_at,
  };
}

export { EMPTY_ADDRESS };