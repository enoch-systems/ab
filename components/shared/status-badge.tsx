import { Badge } from '@/components/ui/badge';
import type { ShipmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Date/time formatting lives in `lib/date-format` so the server, the client and
   the seeded mock data share one engine-independent implementation. Re-exported
   here because this module is the established import path for those helpers. */
export {
  formatDate,
  formatDateTime,
  formatTime,
  formatLongDate,
  formatMonthYear,
  formatWeekdayDate,
  DATE_PLACEHOLDER,
} from '@/lib/date-format';

const statusStyles: Record<ShipmentStatus, string> = {
  'Order Created': 'bg-blue-100/70 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  'Confirmed': 'bg-indigo-100/70 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  'Picked Up': 'bg-sky-100/70 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'In Transit': 'bg-violet-100/70 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'Arrived at Facility': 'bg-cyan-100/70 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
  'Out for Delivery': 'bg-amber-100/70 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'Delivered': 'bg-emerald-100/70 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Exception': 'bg-rose-100/70 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
};

interface StatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status], 'font-medium', className)}>
      {status}
    </Badge>
  );
}

export function formatCurrency(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}
