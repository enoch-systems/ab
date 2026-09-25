import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: React.ReactNode;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent, mobile-first page header used across every admin screen.
 */
export function AdminPageHeader({ title, eyebrow, subtitle, actions, className }: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-7", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5 truncate">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

interface AdminBreadcrumbsProps {
  items: { label: string; href?: string }[];
  className?: string;
}

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-xs text-muted-foreground mb-4 mt-1 min-w-0", className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-foreground transition shrink-0 truncate max-w-[9rem]">
                {item.label}
              </Link>
            ) : (
              <span className={cn("truncate max-w-[10rem]", last ? "text-foreground font-medium" : "")}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/** Small monospace ID pill used in headers (tracking numbers, customer ids). */
export function AdminIdPill({ value, icon }: { value: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold max-w-full">
      {icon}
      <span className="font-mono tracking-tight truncate">{value}</span>
    </span>
  );
}