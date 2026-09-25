export type ShipmentStatus =
  | 'Order Created'
  | 'Confirmed'
  | 'Picked Up'
  | 'In Transit'
  | 'Arrived at Facility'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exception';

export type ShippingMethod = 'Standard' | 'Express' | 'Premium' | 'International';

export type PackageType = 'Box' | 'Envelope' | 'Pallet' | 'Crate' | 'Tube';

export interface Address {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface AdminProfile {
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: 'admin';
  accountStatus: 'Active' | 'Suspended' | 'Pending';
  createdAt: string | null;
  lastActive: string | null;
}

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  location: string;
  date: string;
  time: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming';
}

export interface ShipmentImage {
  id: string;
  shipmentId: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
  createdAt: string;
}

export type MessageSenderRole = 'admin' | 'customer' | 'system';

export interface SupportMessage {
  id: string;
  customerId: string;
  senderId: string | null;
  senderRole: MessageSenderRole;
  subject: string;
  body: string;
  shipmentId?: string;
  readAt?: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  customerId: string;
  sender: Address;
  recipient: Address;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  currentLocation: string;
  packageType: PackageType;
  weight: number;
  dimensions: string;
  packageCount: number;
  shippingMethod: ShippingMethod;
  cost: number;
  currency: string;
  instructions?: string;
  estimatedDelivery: string;
  createdAt: string;
  lastUpdated: string;
  trackingEvents: TrackingEvent[];
  images?: ShipmentImage[];
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  country: string;
  state: string;
  city: string;
  createdAt: string;
  lastActive: string;
  accountStatus: 'Active' | 'Suspended' | 'Pending';
  company?: string;
  defaultShippingMethod?: ShippingMethod;
  defaultPackageType?: PackageType;
  defaultInstructions?: string;
  notifyEmail?: boolean;
  notifySms?: boolean;
  notifyPush?: boolean;
  twoFactorEnabled?: boolean;
}

export type NotificationType =
  | 'shipment_created'
  | 'package_picked_up'
  | 'shipment_in_transit'
  | 'shipment_arrived_facility'
  | 'shipment_out_for_delivery'
  | 'shipment_delivered'
  | 'delivery_exception'
  | 'shipment_confirmed'
  | 'account_welcome';

export interface Notification {
  id: string;
  customerId: string;
  type: NotificationType;
  title: string;
  message: string;
  shipmentId?: string;
  trackingNumber?: string;
  read: boolean;
  createdAt: string;
}

export type ActivityType =
  | 'admin_logged_in'
  | 'admin_profile_updated'
  | 'admin_password_changed'
  | 'customer_registered'
  | 'shipment_created'
  | 'shipment_status_changed'
  | 'tracking_event_added'
  | 'shipment_delivered'
  | 'customer_updated';

export interface Activity {
  id: string;
  type: ActivityType;
  actor: string;
  action: string;
  referenceId?: string;
  customerId?: string;
  shipmentId?: string;
  details?: string;
  timestamp: string;
}

export interface Session {
  userId: string;
  role: 'customer' | 'admin';
  createdAt: string;
}
