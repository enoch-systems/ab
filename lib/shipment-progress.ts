import type { ShipmentStatus, TrackingEvent } from './types';
import { formatRelative } from './date-format';

/**
 * The delivery journey, shared by the operator cockpit and the public tracker.
 *
 * Everything that describes *where a shipment is* lives here: the stage list,
 * the completion percentage, the stage caption and the ETA wording. The admin
 * orders console and the customer facing /track page both render these values,
 * so the public view can never contradict what operations set.
 */

/** The stages a shipment walks through. `Exception` branches off this rail. */
export const SHIPMENT_JOURNEY: ShipmentStatus[] = [
  'Order Created',
  'Confirmed',
  'Picked Up',
  'In Transit',
  'Arrived at Facility',
  'Out for Delivery',
  'Delivered',
];

/** Every status a shipment can hold, journey first, exception branch last. */
export const ALL_SHIPMENT_STATUSES: ShipmentStatus[] = [...SHIPMENT_JOURNEY, 'Exception'];

export const LAST_JOURNEY_INDEX = SHIPMENT_JOURNEY.length - 1;

/** Position of a status on the journey rail, or `-1` for the exception branch. */
export function journeyStageIndex(status: ShipmentStatus): number {
  return SHIPMENT_JOURNEY.indexOf(status);
}

/** Route completion (%) implied by a status — used for previews and the rail. */
export function progressForStatus(status: ShipmentStatus): number {
  const index = journeyStageIndex(status);
  if (index < 0) return status === 'Delivered' ? 100 : 0;
  return Math.round((index / LAST_JOURNEY_INDEX) * 100);
}

/**
 * Route completion (%) for a live shipment.
 *
 * Status driven, so an in-flight parcel never reads as 0% just because some of
 * its scans are not stamped yet. The exception branch has no stage of its own,
 * so it falls back to the scans that were actually recorded.
 */
export function routeProgress(shipment: { status: ShipmentStatus; trackingEvents: TrackingEvent[] }): number {
  if (journeyStageIndex(shipment.status) >= 0) return progressForStatus(shipment.status);
  const { completed, total } = scanStats(shipment.trackingEvents);
  return Math.min(100, Math.round((completed / Math.max(total - 1, 1)) * 100));
}

/** Recorded vs. planned scans, for the "N of M tracking scans recorded" counter. */
export function scanStats(events: TrackingEvent[]): { completed: number; total: number } {
  return {
    completed: events.filter((event) => event.state === 'completed').length,
    total: events.length,
  };
}

/**
 * One-line description of the current leg, worded identically on both surfaces.
 */
export function routeStageCaption(status: ShipmentStatus, currentLocation: string): string {
  const city = currentLocation.split(',')[0].trim() || currentLocation;
  switch (status) {
    case 'Delivered':
      return 'Journey complete — proof of delivery captured';
    case 'Exception':
      return 'Route interrupted — our team is on it';
    case 'Out for Delivery':
      return `Out for final delivery in ${city}`;
    case 'Order Created':
    case 'Confirmed':
      return 'Preparing the parcel for its first leg';
    default:
      return `Moving through ${city}`;
  }
}

/**
 * ETA caption that stays truthful once a window has passed:
 * `due in 3 days`, `2 days ago · overdue`, or `Delivered`.
 * Returns `null` until the caller has a clock (see `useLiveNow`).
 */
export function describeEta(iso: string, status: ShipmentStatus, nowMs: number | null): string | null {
  if (!nowMs) return null;
  if (status === 'Delivered') return 'Delivered';
  const relative = formatRelative(iso, nowMs);
  if (relative === '—') return null;
  return new Date(iso).getTime() < nowMs ? `${relative} · overdue` : `due ${relative}`;
}

/**
 * "3 min ago" style last-update label, or `null` while the clock is not mounted
 * so server and client markup agree.
 */
export function describeLastUpdate(iso: string, nowMs: number | null): string | null {
  return nowMs ? formatRelative(iso, nowMs) : null;
}
