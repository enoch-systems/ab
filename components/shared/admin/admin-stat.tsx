import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  /** Tailwind classes for the icon tile (e.g. "bg-blue-500/10 text-blue-600 dark:text-blue-400"). */
  tone?: string;
  href?: string;
  onClick?: () => void;
  /** Solid (colored) variant for attention stats. */
  solid?: boolean;
  className?: string;
}

/**
 * Compact, information-dense stat card used across the admin area.
 * Two visual modes: `solid` (tinted attention cards) and default tinted-icon card.
 */
export function AdminStatCard({
  label,
  value,
  sub,
  icon,
  tone = "bg-primary/10 text-primary",
  href,
  onClick,
  solid,
  className,
}: AdminStatCardProps) {
  const body = (
    <div className={cn("flex flex-col h-full", solid && "relative")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={cn(
            "inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center shrink-0",
            solid ? "bg-white/20 text-white backdrop-blur-sm" : tone,
          )}
        >
          {icon}
        </span>
        {href && <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100 transition shrink-0 mt-1" />}
      </div>
      <p className="text-2xl sm:text-[26px] font-serif font-bold tracking-tight leading-none mb-1.5 truncate">{value}</p>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", solid ? "opacity-90" : "text-muted-foreground")}>
        {label}
      </p>
      {sub && <p className={cn("text-[11px] mt-1.5 leading-snug", solid ? "opacity-80" : "text-muted-foreground/90")}>{sub}</p>}
    </div>
  );

  const classes = cn(
    "group relative overflow-hidden rounded-2xl p-3.5 sm:p-4 transition",
    solid
      ? "shadow-lg shadow-black/[0.04] active:scale-[0.98]"
      : "border border-border bg-card hover:border-primary/30 shadow-sm active:scale-[0.99]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, "text-left w-full cursor-pointer")}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}

interface AdminMiniStatProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
  className?: string;
}

/** Even more compact stat for dense grids (4-up on mobile). */
export function AdminMiniStat({ label, value, icon, tone = "bg-primary/10 text-primary", className }: AdminMiniStatProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 min-w-0", className)}>
      {icon && <span className={cn("inline-flex w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl items-center justify-center shrink-0", tone)}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-xl font-serif font-semibold leading-none truncate">{value}</p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}