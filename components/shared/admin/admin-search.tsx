"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}

/** Standard admin search input with clear affordance and accessible focus ring. */
export function AdminSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
  autoFocus,
  ariaLabel = "Search",
}: AdminSearchProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-base placeholder:text-muted-foreground/70 transition sm:text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50",
          "[&::-webkit-search-cancel-button]:appearance-none",
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}