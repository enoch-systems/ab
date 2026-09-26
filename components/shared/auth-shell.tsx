"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronsUpDown, Loader2, Lock, Phone } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the customer auth screens (sign in, sign up, reset).
 *
 * Each of these pages used to carry its own copy of the same backdrop, card
 * wrapper and field styling, which is how they drifted apart. They all render
 * through the pieces below now, so a change to the shell lands on every auth
 * screen at once.
 *
 * The surfaces are deliberately roomier than the rest of the app: these forms
 * carry identity and contact detail, and a cramped field column makes people
 * mistype email addresses.
 */

/** Decorative background — grid plus three soft brand glows. */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="ops-auth-grid absolute inset-0" />
      <div className="absolute -top-32 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
    </div>
  );
}

/** Card widths, kept in one place so sign in and sign up stay the same scale. */
const AUTH_WIDTHS = {
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
} as const;

export function AuthShell({
  children,
  width = "md",
}: {
  children: ReactNode;
  /** `md` for the two-field sign-in card, `xl`/`2xl` for the multi-step wizard. */
  width?: keyof typeof AUTH_WIDTHS;
}) {
  return (
    <div className="customer-shell flex min-h-screen min-w-0 flex-col bg-background text-foreground">
      <Header variant="default" />
      <main className="relative flex min-w-0 flex-1 items-center justify-center overflow-x-clip px-3 py-8 sm:px-4 sm:py-12 lg:py-14">
        <AuthBackdrop />
        <div
          className={cn(
            "relative z-10 mt-14 w-full min-w-0 animate-blur-in",
            AUTH_WIDTHS[width]
          )}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * The card + brand header shared by every auth screen. `headerExtra` sits
 * between the description and the fields — the wizard uses it for the step meter.
 */
export function AuthCard({
  eyebrow,
  logoClassName,
  title,
  description,
  children,
  className,
  headerExtra,
}: {
  /** Small pill above the headline (e.g. "Create your account"). */
  eyebrow?: ReactNode;
  logoClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "boty-shadow relative overflow-hidden border border-border/80 bg-card/90 backdrop-blur-sm",
        className
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent"
        aria-hidden="true"
      />
      <div className="relative px-4 pt-8 pb-6 text-center sm:px-12 sm:pt-12 sm:pb-8">
        <BrandLogo
          className={cn("mx-auto rounded-2xl object-contain", logoClassName ?? "h-14 w-14 sm:h-16 sm:w-16")}
        />
        {eyebrow ? (
          <span className="mt-5 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3.5 py-1.5 text-center text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 font-serif text-[1.7rem] leading-[1.12] font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.6rem]">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-pretty text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
        {headerExtra ? <div className="mt-6">{headerExtra}</div> : null}
      </div>
      {children}
    </Card>
  );
}

/**
 * Quiet reassurance row under an auth card: three short claims with icons.
 * Sign in and sign up carry the same row so the two screens feel like one flow.
 */
export function AuthTrustRow({
  items,
  className,
}: {
  items: { icon: ReactNode; label: string; detail: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("mt-6 grid gap-3 sm:grid-cols-3", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{item.label}</span>
            <span className="block text-xs leading-snug text-muted-foreground">{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export type WizardStepMeta = {
  id: string;
  /** Long form, used for the screen-reader announcement and the card headline. */
  title: string;
  /** Short form shown beside the meter while the step is current. */
  short: string;
  /** One-line "what happens here", surfaced as the segment tooltip. */
  blurb?: string;
  /** Glyph for the current step, shown in the caption line. */
  icon?: ReactNode;
};

/**
 * Progress, the quiet way: one hairline segment per step that fills as the
 * visitor advances, and a single caption line under it. Nothing is spelled out
 * ahead of time — the wizard reveals itself as it is filled in, so the screen
 * stays about the one question being asked, the way an Apple checkout reads.
 *
 * Completed segments stay clickable, so stepping back to fix an email never
 * means walking the whole wizard backwards. Position is announced twice (fill
 * plus polite live region) because colour alone is not an accessible signal.
 */
export function StepProgress({
  steps,
  current,
  activeFill = 0,
  onStepSelect,
  className,
}: {
  steps: WizardStepMeta[];
  current: number;
  /**
   * 0–1 share of the current step that already validates, so the active segment
   * creeps towards full while the visitor types instead of jumping on Continue.
   */
  activeFill?: number;
  /** When provided, already-completed segments become clickable. */
  onStepSelect?: (index: number) => void;
  className?: string;
}) {
  const total = steps.length;
  const percent = Math.round(((current + 1) / total) * 100);
  const active = steps[current];
  const remaining = total - current - 1;
  const filled = Math.min(Math.max(activeFill, 0), 1);
  // The active segment never sits empty — it opens at 20% so motion on the next
  // keystroke is visible, then fills the rest as the step's answers check out.
  const activeWidth = `${Math.round((0.2 + 0.8 * filled) * 100)}%`;

  return (
    <div className={cn("text-left", className)}>
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Signup progress: step ${current + 1} of ${total}, ${active?.title}`}
      >
        {steps.map((step, index) => {
          const done = index < current;
          const isActive = index === current;
          // Only completed steps reopen — the road ahead stays shut.
          const canJump = Boolean(onStepSelect) && done;
          return (
            <button
              key={step.id}
              type="button"
              disabled={!canJump}
              onClick={() => onStepSelect?.(index)}
              title={
                step.blurb
                  ? `Step ${index + 1}: ${step.short} — ${step.blurb}`
                  : `Step ${index + 1}: ${step.short}`
              }
              aria-label={canJump ? `Back to step ${index + 1}: ${step.short}` : undefined}
              className={cn(
                "relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted boty-transition",
                canJump ? "cursor-pointer hover:bg-primary/25" : "cursor-default",
              )}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-primary to-accent transition-[width] duration-500 ease-out"
                style={{ width: done ? "100%" : isActive ? activeWidth : "0%" }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
          {active?.icon ? <span className="text-primary/80">{active.icon}</span> : null}
          Step {current + 1} of {total}
          <span className="font-medium tracking-normal text-muted-foreground normal-case">{active?.short}</span>
        </p>
        <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {percent}% complete
          {remaining > 0 ? ` · ${remaining} step${remaining === 1 ? "" : "s"} left` : " · last step"}
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        Step {current + 1} of {total}: {active?.title}
      </p>
    </div>
  );
}


/**
 * A labelled form field with the standard auth treatment: uppercase label,
 * leading icon, optional trailing control, and a hint/error line.
 *
 * Inputs are intentionally taller than the app default — a taller target is
 * easier to hit on a phone and makes the caret position obvious.
 */
export function AuthField({
  label,
  htmlFor,
  icon,
  trailing,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  /** Helper text under the input. */
  hint?: ReactNode;
  /** Validation message; rendered in place of the hint. */
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
        >
          {label}
        </Label>
        {optional ? (
          <span className="text-[11px] font-medium text-muted-foreground/70">Optional</span>
        ) : null}
      </div>
      <div
        className={cn(
          "relative",
          "[&_input]:h-12 [&_input]:rounded-xl [&_input]:bg-background/60 [&_input]:px-4 [&_input]:text-[15px]",
          "[&_input]:placeholder:text-muted-foreground/60 sm:[&_input]:text-base",
          icon ? "[&_input]:pl-12" : "",
          trailing ? "[&_input]:pr-12" : ""
        )}
      >
        {icon ? (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        {children}
        {trailing ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div> : null}
      </div>
      {error ? (
        <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-[13px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Inline alert used for form-level errors. */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
    >
      {children}
    </div>
  );
}

/**
 * Wizard footer: an optional extra block (e.g. the terms checkbox), then Back
 * and the primary submit. The primary control is a real submit button so Enter
 * advances or submits from any field without extra key handling.
 */
export function AuthSubmitRow({
  submitLabel,
  backLabel,
  onBack,
  loading,
  disabled,
  backDisabled,
  loadingLabel,
  submitIcon,
  hint,
  children,
}: {
  submitLabel: string;
  backLabel: string;
  onBack: () => void;
  loading?: boolean;
  disabled?: boolean;
  backDisabled?: boolean;
  loadingLabel?: string;
  /** Glyph shown before the primary label (hidden while loading). */
  submitIcon?: ReactNode;
  /** Reassurance line under the buttons, e.g. what happens after submit. */
  hint?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={cn("space-y-5 border-t border-border/60 bg-muted/20 px-4 py-6 sm:px-12 sm:py-7")}>
      {children}
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={backDisabled || loading}
          className="boty-transition order-2 h-12 w-full gap-2 rounded-full px-7 text-sm sm:order-1 sm:h-12 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {backLabel}
        </Button>
        <Button
          type="submit"
          disabled={disabled || loading}
          className="boty-transition order-1 h-12 w-full gap-2 rounded-full px-5 text-[15px] font-semibold shadow-lg shadow-primary/25 sm:order-2 sm:h-12 sm:flex-1"
        >
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : submitIcon}
          <span className="min-w-0 truncate">{loading ? (loadingLabel ?? "Working…") : submitLabel}</span>
          {!loading ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
        </Button>
      </div>
      {hint ? (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
          <span>{hint}</span>
        </p>
      ) : null}
    </div>
  );
}


/* ── Country / state pickers ─────────────────────────────────────────────── */

export type CountryOption = { name: string; isoCode: string; phonecode: string };
export type PickerOption = { value: string; label: string; detail?: string };

/** Phone dialling-code selector. */
export function CodePicker({
  value,
  search,
  open,
  options,
  onSearch,
  onOpenChange,
  onSelect,
}: {
  value: string;
  search: string;
  open: boolean;
  options: CountryOption[];
  onSearch: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (country: CountryOption) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-28 shrink-0 justify-between rounded-xl bg-background/60 px-4"
        >
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            +{value.replace(/^\+/, "")}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="min-w-72 w-(--radix-popover-trigger-width) p-0"
        side="bottom"
        sideOffset={6}
        align="start"
      >
        <Command>
          <CommandInput value={search} onValueChange={onSearch} placeholder="Search country code..." />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>No country code found.</CommandEmpty>
            {options.map((country) => (
              <CommandItem
                key={country.isoCode}
                value={`${country.name} ${country.phonecode}`}
                onSelect={() => onSelect(country)}
              >
                <Check
                  className={cn("h-4 w-4", value === `+${country.phonecode}` ? "opacity-100" : "opacity-0")}
                />
                <span className="flex-1">{country.name}</span>
                <span className="text-muted-foreground">+{country.phonecode}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Searchable country or state selector. */
export function SearchPicker({
  value,
  placeholder,
  open,
  search,
  disabled,
  className,
  leadingIcon,
  options,
  onSearch,
  onOpenChange,
  onSelect,
}: {
  value: string;
  placeholder: string;
  open: boolean;
  search: string;
  disabled?: boolean;
  className?: string;
  leadingIcon?: ReactNode;
  options: PickerOption[];
  onSearch: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between rounded-xl bg-background/60 px-4 font-normal",
            className
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {leadingIcon ? <span className="shrink-0 text-muted-foreground">{leadingIcon}</span> : null}
            <span className={cn("truncate", value.startsWith("Select ") && "text-muted-foreground/70")}>
              {value}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        side="bottom"
        sideOffset={6}
        align="start"
      >
        <Command>
          <CommandInput value={search} onValueChange={onSearch} placeholder={placeholder} />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>No matches found.</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={`${option.label} ${option.detail ?? ""}`}
                onSelect={() => onSelect(option.value)}
              >
                <Check className={cn("h-4 w-4", value === option.label ? "opacity-100" : "opacity-0")} />
                <span>{option.label}</span>
                {option.detail ? (
                  <span className="ml-auto text-muted-foreground">{option.detail}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Moves focus to the first field whenever the wizard step changes, so keyboard
 * and screen-reader users are not stranded at the top of the card after Next.
 */
export function useStepFocus(step: number, targetId: string) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) {
      done.current = false;
      return;
    }
    done.current = true;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [step, targetId]);
}

