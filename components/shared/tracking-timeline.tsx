import { Check, Circle, AlertTriangle } from 'lucide-react';
import type { Shipment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TrackingTimelineProps {
  events: Shipment['trackingEvents'];
  className?: string;
  /** Stagger the steps in (used by the admin operations cockpit). */
  animate?: boolean;
  /**
   * Event ids to spotlight with a one-off ring flash — pass the scan that just
   * landed so the operator can see the timeline react to their update.
   */
  flashIds?: string[];
}

export function TrackingTimeline({ events, className, animate, flashIds }: TrackingTimelineProps) {
  if (!events?.length) return null;

  return (
    <ol className={cn('relative pl-1 sm:pl-0', className)}>
      <div className="absolute left-4 sm:left-4 top-2 bottom-2 w-[2px] bg-border rounded-full overflow-hidden">
        <div
          className="timeline-line w-full rounded-full transition-[height] duration-700 ease-out"
          style={{
            height: `${Math.max(
              8,
              (events.filter((e) => e.state === 'completed').length / Math.max(events.length - 1, 1)) * 100,
            )}%`,
          }}
        />
      </div>
      {events.map((ev, idx) => {
        const isLast = idx === events.length - 1;
        const isException = ev.status === 'Exception' && ev.state !== 'upcoming';
        return (
          <li
            key={ev.id}
            className={cn(
              'relative flex gap-4 py-4',
              isLast ? '' : '',
              animate && 'animate-rise-in',
              flashIds?.includes(ev.id) && 'timeline-flash',
            )}
            style={animate ? { animationDelay: `${Math.min(idx, 8) * 45}ms` } : undefined}
          >
            <div
              className={cn(
                'relative z-10 flex-shrink-0 w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2',
                ev.state === 'completed' &&
                  'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20',
                ev.state === 'current' &&
                  cn('bg-card border-primary text-primary ring-4 ring-primary/20', !animate && 'animate-pulse'),
                ev.state === 'upcoming' &&
                  'bg-background border-border text-muted-foreground/60',
                ev.status === 'Exception' && ev.state !== 'upcoming' &&
                  'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20 ring-4 ring-rose-500/10',
              )}
            >
              {ev.state === 'current' && animate && (
                <span aria-hidden className="absolute inset-0 rounded-full bg-primary/25 animate-pulse-halo" />
              )}
              {ev.state === 'completed' && ev.status !== 'Exception' && <Check className="w-3.5 h-3.5" />}
              {ev.state === 'upcoming' && <Circle className="w-2.5 h-2.5" />}
              {ev.state === 'current' && ev.status === 'Exception' && <AlertTriangle className="w-3.5 h-3.5" />}
              {ev.state === 'current' && ev.status !== 'Exception' && (
                <Circle className="relative w-2.5 h-2.5 fill-primary" />
              )}
            </div>
            <div
              className={cn(
                'flex-1 pb-2 min-w-0',
                ev.state === 'upcoming' ? 'opacity-50' : '',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={cn(
                        'font-semibold text-sm sm:text-base',
                        ev.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                        isException && 'text-rose-600 dark:text-rose-400',
                      )}
                    >
                      {ev.status}
                    </h4>
                    {ev.state === 'current' && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                          isException
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            isException ? 'bg-rose-500' : 'bg-primary animate-pulse',
                          )}
                        />
                        {isException ? 'Needs attention' : 'In progress'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{ev.location}</p>
                </div>
                {(ev.date || ev.time) && (
                  <div className="max-w-full text-right text-xs text-muted-foreground sm:text-sm sm:whitespace-nowrap">
                    {ev.date && <span className="block">{ev.date}</span>}
                    {ev.time && <span className="block text-[11px] sm:text-xs">{ev.time}</span>}
                  </div>
                )}
              </div>
              {ev.description && (
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
