/**
 * Admin typography scale — the single source of truth for text hierarchy.
 *
 * Rules of the house:
 *  1. A **label** is always small, uppercase, widely tracked and muted grey.
 *  2. A **value** is always darker (`text-foreground`) and semibold, so the eye
 *     lands on data and not on the words describing it.
 *  3. Sizes only ever step between this short list — never invent new ones.
 *  4. Labels are never dimmed below `text-muted-foreground`: the hierarchy comes
 *     from weight, case, tracking and the darker value colour, not from opacity.
 *     (Grey is already ~5.5:1 on white, so `text-muted-foreground/70` fails AA.)
 *
 * Two label roles, deliberately different:
 *  - **Data labels** (the name of a value that already exists on screen) use
 *    `label` / `labelMicro`. They are muted so values win the scan.
 *  - **Form labels** (a field the operator is about to type into) keep the
 *    design-system `<Label>` look — dark, 14px, medium — because input labels
 *    must stay legible while typing. Don't force `label` onto inputs.
 *
 * Merging: every token is plain Tailwind utilities, so `cn()` (tailwind-merge)
 * resolves conflicts in favour of whatever comes last, e.g.
 *   `cn(ADMIN_TYPE.label, "text-amber-700")`            → amber label
 *   `cn(ADMIN_TYPE.labelMicro, "text-current")`          → label that inherits a tinted tile
 *   `cn(ADMIN_TYPE.statValue, "text-lg sm:text-xl")`     → same hero number, smaller
 */
export const ADMIN_TYPE = {
  /** Page H1 — e.g. "Shipment Operations", "Orders". */
  pageTitle:
    "font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl",
  /** Panel / card heading — the titles rendered by `AdminPanel`. */
  sectionTitle:
    "font-serif text-base font-semibold leading-tight tracking-tight text-foreground sm:text-[17px]",
  /** One-line explanation under a page title or panel heading. */
  meta: "text-[13px] leading-relaxed text-muted-foreground sm:text-sm",
  /** Secondary sentence inside a panel, card or empty state. */
  secondary: "text-xs leading-relaxed text-muted-foreground",
  /** Shorter panel subtitle (fits in a header bar). */
  panelSubtitle: "text-[11px] leading-snug text-muted-foreground sm:text-xs",
  /** Sheet / dialog heading (bigger than a panel title). */
  dialogTitle:
    "font-serif text-xl font-semibold leading-tight tracking-tight text-foreground",
  /** Hero number (serif) — stat cards and analytics headlines. Size is tuned per surface via `cn()`. */
  statValue: "font-serif text-2xl font-semibold leading-none tracking-tight text-foreground",
  /** Standard field label: Type, ETA, Email, Destination, … */
  label: "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
  /** Micro label for dense surfaces: table heads, stat captions, chips. */
  labelMicro: "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
  /** Standard field value (14px) — the default for data. */
  value: "text-sm font-semibold leading-snug text-foreground",
  /** Hero value (15px) — live facts, names, stat headlines. */
  valueLarge: "text-[15px] font-semibold leading-tight tracking-tight text-foreground",
  /** Dense value (13px) — inside compact grids and contact rows. */
  valueSmall: "text-[13px] font-medium leading-snug text-foreground",
  /** Hint / helper copy under an input or a value. */
  help: "text-[11px] leading-relaxed text-muted-foreground",
} as const;

export type AdminTypeToken = keyof typeof ADMIN_TYPE;
