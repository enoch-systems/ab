import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminPanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Hide the header entirely (e.g. image panels). */
  headerless?: boolean;
}

/**
 * The standard rounded surface/panel used on every admin page.
 * Mobile-first padding, consistent radius and header treatment.
 */
export function AdminPanel({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  contentClassName,
  headerless,
}: AdminPanelProps) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      {!headerless && (title || action) && (
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border/60 flex items-center gap-3 min-w-0">
          {icon && (
            <span className="inline-flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0">
              {icon}
            </span>
          )}
          {(title || subtitle) && (
            <div className="flex-1 min-w-0">
              {title && <h3 className="font-serif text-base sm:text-[17px] leading-tight truncate">{title}</h3>}
              {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}