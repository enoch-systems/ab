import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminEmptyProps {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Polished, theme-aware empty state used across the admin area. */
export function AdminEmpty({ icon, title, hint, action, className }: AdminEmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-4 py-10 sm:py-12", className)}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl border border-border bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}