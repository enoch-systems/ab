"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Render on desktop too when true (defaults to mobile-only). */
  showOnDesktop?: boolean;
}

/**
 * Mobile-first bottom sheet used for filters and quick actions in the admin area.
 * Feels like a native sheet: grab handle, rounded top, safe-area padding.
 */
export function AdminBottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  showOnDesktop,
}: AdminBottomSheetProps) {
  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-[70]", !showOnDesktop && "lg:hidden")}>
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true" data-lenis-prevent
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border shadow-2xl",
          "animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto",
          className,
        )}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 px-4 pt-3 pb-2 border-b border-border/50">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-3" />
          {title && <h3 className="font-serif text-lg leading-tight">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="p-4 pb-8">{children}</div>
        {footer && <div className="px-4 pb-safe border-t border-border/50 pt-3">{footer}</div>}
      </div>
    </div>
  );
}