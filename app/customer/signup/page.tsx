"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Country, State } from "country-state-city";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthShell,
  AuthSubmitRow,
  AuthTrustRow,
  CodePicker,
  SearchPicker,
  StepProgress,
  useStepFocus,
  type WizardStepMeta,
} from "@/components/shared/auth-shell";
import { PolicyModal } from "@/components/shared/policy-modal";
import { AuthSuccessOverlay, type AuthOverlayStage } from "@/components/shared/auth-success-overlay";
import { useAppState } from "@/lib/app-state";
import { toast } from "sonner";
import {
  BadgeCheck,
  Check,
  ClipboardCheck,
  Eye,
  EyeOff,
  Globe2,
  Headphones,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from "lucide-react";

/**
 * Four-step account wizard.
 *
 * The old page stacked all seven fields into one long scroll, so a visitor had
 * to hold the whole form in their head before finding out whether it was
 * correct. Splitting it means each screen asks for one thing, and the step
 * meter above the card always says where they are, how far along, and how much
 * is left.
 *
 * Validation runs per step on Continue, so an error appears next to the field
 * that caused it rather than as one summary message at the bottom of the form.
 * Once a step is finished its meter tile turns into a button, so fixing a typo
 * in an email address never means walking the wizard backwards.
 */
const STEPS: WizardStepMeta[] = [
  {
    id: "identity",
    title: "Tell us who is shipping",
    short: "Your details",
    blurb: "Name and email — about 30 seconds",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    id: "security",
    title: "Secure your account",
    short: "Password",
    blurb: "Pick something you will remember",
    icon: <KeyRound className="h-4 w-4" />,
  },
  {
    id: "contact",
    title: "Where should we reach you?",
    short: "Contact & location",
    blurb: "Phone, country and state for pickup",
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    id: "review",
    title: "Review and create your account",
    short: "Review & finish",
    blurb: "Check the details, accept the terms",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
];

/** Per-step supporting copy under the headline. */
const STEP_DESCRIPTIONS = [
  "Start with the basics. This is the only screen with a name and an email in it.",
  "Choose something you will remember — you will need it every time you sign in.",
  "We only use these to arrange pickups and send tracking updates.",
  "Everything you entered, in one place. Fix anything that looks off, then create the account.",
];

/** First focusable control on each step, so Continue lands the caret sensibly. */
const STEP_FOCUS = ["fullName", "password", "phone", "terms"] as const;

/** Fields validated by each step — also the list cleared before re-validating. */
const STEP_FIELDS: (keyof FormState | "terms")[][] = [
  ["fullName", "email"],
  ["password", "confirmPassword"],
  ["phone", "country", "state"],
  ["terms"],
];

/** What the visitor gets for signing up, shown under the card. */
const TRUST_ITEMS = [
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Encrypted end to end",
    detail: "Your details travel over TLS 1.3",
  },
  {
    icon: <BadgeCheck className="h-4 w-4" />,
    label: "No card required",
    detail: "Rates, coverage and tracking are free",
  },
  {
    icon: <Headphones className="h-4 w-4" />,
    label: "Human support",
    detail: "A specialist answers within one business day",
  },
];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  state: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  country: "US",
  state: "",
};

/** Deliberately permissive: the authoritative check is the signUp call itself. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function CustomerSignupPage() {
  const router = useRouter();
  const { customerSignup } = useAppState();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState | "terms", string>>>({});
  const [formError, setFormError] = useState("");

  const [phoneCode, setPhoneCode] = useState("+1");
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [phoneCodeSearch, setPhoneCodeSearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayStage, setOverlayStage] = useState<AuthOverlayStage>("working");
  const [overlayKind, setOverlayKind] = useState<"signup" | "verify-email">("signup");
  const [policy, setPolicy] = useState<"terms" | "privacy" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useStepFocus(step, STEP_FOCUS[step]);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(form.country), [form.country]);
  const selectedCountry = countries.find((country) => country.isoCode === form.country);
  const selectedState = states.find((state) => state.isoCode === form.state);

  const filteredCountries = useMemo(
    () =>
      countries.filter((country) => {
        const search = countrySearch.toLowerCase().trim();
        return (
          !search ||
          country.name.toLowerCase().includes(search) ||
          country.isoCode.toLowerCase().includes(search)
        );
      }),
    [countries, countrySearch]
  );

  const filteredStates = useMemo(
    () =>
      states.filter((state) => {
        const search = stateSearch.toLowerCase().trim();
        return (
          !search ||
          state.name.toLowerCase().includes(search) ||
          state.isoCode.toLowerCase().includes(search)
        );
      }),
    [states, stateSearch]
  );

  const filteredPhoneCountries = useMemo(
    () =>
      countries.filter((country) => {
        const search = phoneCodeSearch.toLowerCase().trim();
        return !search || country.name.toLowerCase().includes(search) || country.phonecode.includes(search);
      }),
    [countries, phoneCodeSearch]
  );

  const isLastStep = step === STEPS.length - 1;

  /** Live strength checklist for the password step — guidance, not a gate. */
  const passwordChecks = [
    { label: "At least 8 characters", ok: form.password.length >= 8 },
    {
      label: "Upper and lower case",
      ok: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password),
    },
    { label: "One number", ok: /\d/.test(form.password) },
  ];

  /**
   * Share of the current step that already validates, 0–1. One entry per field
   * in that step, so the meter's active segment grows as the form is filled in
   * rather than only when Continue is pressed.
   */
  const stepFill =
    [
      [form.fullName.trim().length >= 2, EMAIL_RE.test(form.email.trim())],
      [form.password.length >= 8, Boolean(form.confirmPassword) && form.confirmPassword === form.password],
      [form.phone.replace(/\D/g, "").length >= 7, Boolean(form.country), Boolean(form.state)],
      [agreedToTerms],
    ][step].filter(Boolean).length / STEP_FIELDS[step].length;

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  /** Validates one step and returns whether the visitor may move on. */
  const validateStep = (index: number) => {
    const errors: Partial<Record<keyof FormState | "terms", string>> = {};

    if (index === 0) {
      if (form.fullName.trim().length < 2) {
        errors.fullName = "Enter the full name we should use on delivery documents.";
      }
      if (!EMAIL_RE.test(form.email.trim())) {
        errors.email = "Enter a valid email address, e.g. you@company.com.";
      }
    }

    if (index === 1) {
      if (form.password.length < 8) {
        errors.password = "Use at least 8 characters.";
      }
      if (!form.confirmPassword || form.confirmPassword !== form.password) {
        errors.confirmPassword = "Both passwords must match.";
      }
    }

    if (index === 2) {
      if (form.phone.replace(/\D/g, "").length < 7) {
        errors.phone = "Enter a phone number the courier can reach.";
      }
      if (!form.country) {
        errors.country = "Select the country the shipment moves from.";
      }
      if (!form.state) {
        errors.state = "Select a state or region.";
      }
    }

    if (index === 3 && !agreedToTerms) {
      errors.terms = "Please accept the Terms of Service and Privacy Policy.";
    }

    setFieldErrors((current) => {
      const next = { ...current };
      for (const field of STEP_FIELDS[index]) delete next[field];
      return { ...next, ...errors };
    });

    return Object.keys(errors).length === 0;
  };

  /** Continue on every step but the last; the last step submits the form. */
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!validateStep(step)) return;

    if (!isLastStep) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
      return;
    }

    setLoading(true);
    setOverlayOpen(true);
    setOverlayStage("working");
    setOverlayKind("signup");
    try {
      const result = await customerSignup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: `${phoneCode} ${form.phone.trim()}`,
        password: form.password,
        address: "",
        country: selectedCountry?.name ?? form.country,
        state: selectedState?.name ?? form.state,
        city: "",
      });

      if (!result.success) {
        setOverlayOpen(false);
        setFormError(result.error || "Unable to create your account. Please try again.");
        return;
      }

      if (result.requiresEmailConfirmation) {
        setOverlayKind("verify-email");
        setOverlayStage("success");
        toast.success("Check your email to confirm your account.", {
          description: "Your account is ready. Confirm your email, then sign in to continue.",
        });
        setTimeout(() => router.push("/customer/login"), 2400);
        return;
      }

      setOverlayKind("signup");
      setOverlayStage("success");
      toast.success("Account created!", { description: "Welcome to ArcBest. You are now signed in." });
      setTimeout(() => router.push("/customer/dashboard"), 2300);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  /** Jump back to a step already reached (driven by the meter tiles). */
  const goToStep = (index: number) => {
    if (index >= step) return;
    setFormError("");
    setStep(index);
  };

  return (
    <AuthShell width="2xl">
      <AuthCard
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Create your account
          </>
        }
        title={STEPS[step].title}
        description={STEP_DESCRIPTIONS[step]}
        headerExtra={
          <StepProgress steps={STEPS} current={step} activeFill={stepFill} onStepSelect={goToStep} />
        }
      >
        <form onSubmit={submit} noValidate>
          {formError ? (
            <div className="px-6 pt-6 sm:px-12">
              <AuthAlert>{formError}</AuthAlert>
            </div>
          ) : null}

          {/* Step 1 — identity */}
          {step === 0 && (
            <div className="grid animate-blur-in gap-6 px-6 py-7 sm:grid-cols-2 sm:px-12 sm:py-9">
              <AuthField
                label="Full name"
                htmlFor="fullName"
                icon={<UserRound className="h-4 w-4" />}
                error={fieldErrors.fullName}
                hint="As it should appear on a delivery."
              >
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="e.g. Jordan Williams"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                />
              </AuthField>
              <AuthField
                label="Email address"
                htmlFor="email"
                icon={<Mail className="h-4 w-4" />}
                error={fieldErrors.email}
                hint="Tracking updates and pickup confirmations land here."
              >
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </AuthField>
            </div>
          )}

          {/* Step 2 — security */}
          {step === 1 && (
            <div className="grid animate-blur-in gap-6 px-6 py-7 sm:grid-cols-2 sm:px-12 sm:py-9">
              <AuthField
                label="Password"
                htmlFor="password"
                icon={<Lock className="h-4 w-4" />}
                error={fieldErrors.password}
                hint="At least 8 characters. A mix of letters and numbers works best."
                trailing={
                  <PasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    label="password"
                  />
                }
              >
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
              </AuthField>
              <AuthField
                label="Confirm password"
                htmlFor="confirmPassword"
                icon={<Lock className="h-4 w-4" />}
                error={fieldErrors.confirmPassword}
                hint="Type it once more so a typo cannot lock you out."
                trailing={
                  <PasswordToggle
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((v) => !v)}
                    label="confirmation password"
                  />
                }
              >
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
              </AuthField>

              {form.password.length > 0 ? (
                <ul className="flex flex-wrap gap-2 sm:col-span-2" aria-live="polite">
                  {passwordChecks.map((check) => (
                    <li
                      key={check.label}
                      className={
                        check.ok
                          ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                          : "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      <Check className={check.ok ? "h-3.5 w-3.5" : "h-3.5 w-3.5 opacity-40"} />
                      {check.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:col-span-2">
                  ArcBest staff can never see this password. Store it in your password manager and you are done here.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — contact & location */}
          {step === 2 && (
            <div className="animate-blur-in space-y-6 px-6 py-7 sm:px-12 sm:py-9">
              <AuthField
                label="Phone number"
                htmlFor="phone"
                error={fieldErrors.phone}
                hint="Your courier may call before delivery, so use a number you answer."
              >
                <div className="flex gap-2 [&_input]:h-12">
                  <CodePicker
                    value={phoneCode}
                    search={phoneCodeSearch}
                    open={phoneCodeOpen}
                    options={filteredPhoneCountries}
                    onSearch={setPhoneCodeSearch}
                    onOpenChange={setPhoneCodeOpen}
                    onSelect={(country) => {
                      setPhoneCode(country.phonecode);
                      setPhoneCodeOpen(false);
                      setPhoneCodeSearch("");
                      setFieldErrors((current) => ({ ...current, phone: undefined }));
                    }}
                  />
                  <div className="relative min-w-0 flex-1">
                    <Phone className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="phone"
                      className="w-full pl-11!"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="(555) 123-4567"
                      autoComplete="tel-national"
                      inputMode="tel"
                      aria-invalid={Boolean(fieldErrors.phone)}
                    />
                  </div>
                </div>
              </AuthField>

              <div className="grid gap-6 sm:grid-cols-2">
                <AuthField label="Country" error={fieldErrors.country}>
                  <SearchPicker
                    value={selectedCountry?.name ?? "Select country"}
                    placeholder="Search countries..."
                    leadingIcon={<Globe2 className="h-4 w-4" />}
                    open={countryOpen}
                    search={countrySearch}
                    disabled={loading}
                    options={filteredCountries.map((country) => ({
                      value: country.isoCode,
                      label: country.name,
                      detail: country.isoCode,
                    }))}
                    onSearch={setCountrySearch}
                    onOpenChange={setCountryOpen}
                    onSelect={(value) => {
                      // Changing country invalidates the state list.
                      setForm((current) => ({ ...current, country: value, state: "" }));
                      setCountryOpen(false);
                      setCountrySearch("");
                      setFieldErrors((current) => ({ ...current, country: undefined, state: undefined }));
                    }}
                  />
                </AuthField>

                <AuthField label="State / region" error={fieldErrors.state}>
                  <SearchPicker
                    value={selectedState?.name ?? "Select state"}
                    placeholder={form.country ? "Search states..." : "Select a country first"}
                    leadingIcon={<MapPin className="h-4 w-4" />}
                    open={stateOpen}
                    search={stateSearch}
                    disabled={!form.country || states.length === 0 || loading}
                    options={filteredStates.map((state) => ({
                      value: state.isoCode,
                      label: state.name,
                      detail: state.isoCode,
                    }))}
                    onSearch={setStateSearch}
                    onOpenChange={setStateOpen}
                    onSelect={(value) => {
                      setForm((current) => ({ ...current, state: value }));
                      setStateOpen(false);
                      setStateSearch("");
                      setFieldErrors((current) => ({ ...current, state: undefined }));
                    }}
                  />
                </AuthField>
              </div>

              <p className="text-[13px] leading-relaxed text-muted-foreground">
                No street address needed yet — you will confirm the exact pickup and delivery addresses on each booking.
              </p>
            </div>
          )}

          {/* Step 4 — review */}
          {step === 3 && (
            <div className="animate-blur-in px-4 py-6 sm:px-12 sm:py-9">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {REVIEW_ROWS.map((row) => {
                  const value = row.read({
                    fullName: form.fullName,
                    email: form.email,
                    phone: `${phoneCode} ${form.phone.trim()}`.trim(),
                    country: selectedCountry?.name ?? "—",
                    state: selectedState?.name ?? "—",
                  });
                  return (
                    <li
                      key={row.label}
                      className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-3.5 sm:p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {row.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          {row.label}
                        </p>
                        <p className="mt-1 text-[15px] leading-snug font-medium break-all text-foreground [overflow-wrap:anywhere]">
                          {value || "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep(row.step)}
                        aria-label={`Edit ${row.label}`}
                        className="boty-transition mt-0.5 min-h-[36px] min-w-[52px] shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95"
                      >
                        Edit
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
                <span className="min-w-0">
                  Your password is never shown. Use{" "}
                  <span className="font-semibold text-foreground">Edit</span> on the password step to change it before
                  you finish.
                </span>
              </p>
            </div>
          )}

          <AuthSubmitRow
            submitLabel={isLastStep ? "Create my account" : "Continue"}
            submitIcon={isLastStep ? <UserPlus className="h-4 w-4" /> : undefined}
            loadingLabel="Creating your account…"
            backLabel="Back"
            onBack={goBack}
            backDisabled={step === 0}
            loading={loading}
            disabled={isLastStep && !agreedToTerms}
            hint={
              isLastStep
                ? "Creating an account is free. You can track every parcel, download documents and rebook in one click."
                : `Next up: ${STEPS[step + 1].short.toLowerCase()}. Nothing is submitted until the final step.`
            }
          >
            {isLastStep && (
              <div className="space-y-2">
                <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <Checkbox
                    id="terms"
                    aria-label="Agree to the Terms of Service and Privacy Policy"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => {
                      setAgreedToTerms(checked === true);
                      if (checked === true) setFieldErrors((c) => ({ ...c, terms: undefined }));
                    }}
                    disabled={loading}
                    className="mt-1 size-5 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setPolicy("terms")}
                      className="inline cursor-pointer font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setPolicy("privacy")}
                      className="inline cursor-pointer font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </div>
                {fieldErrors.terms ? (
                  <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{fieldErrors.terms}</p>
                ) : null}
              </div>
            )}
          </AuthSubmitRow>

          <p className="border-t border-border/60 px-6 py-5 text-center text-sm text-muted-foreground sm:px-12">
            Already have an account?{" "}
            <Link
              href="/customer/login"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
      <AuthTrustRow items={TRUST_ITEMS} />
      <PolicyModal type={policy} onClose={() => setPolicy(null)} />
      <AuthSuccessOverlay
        open={overlayOpen}
        stage={overlayStage}
        kind={overlayKind}
        email={form.email.trim() || undefined}
        name={form.fullName.trim() || undefined}
        onContinue={() => router.push(overlayKind === "verify-email" ? "/customer/login" : "/customer/dashboard")}
      />
    </AuthShell>
  );
}

/** Review cards: icon, the step they belong to, and how to read the value back. */
const REVIEW_ROWS: {
  label: string;
  step: number;
  icon: React.ReactNode;
  read: (values: Record<string, string>) => string;
}[] = [
  {
    label: "Name",
    step: 0,
    icon: <UserRound className="h-4 w-4" />,
    read: (v) => v.fullName,
  },
  {
    label: "Email",
    step: 0,
    icon: <Mail className="h-4 w-4" />,
    read: (v) => v.email,
  },
  {
    label: "Phone",
    step: 2,
    icon: <Phone className="h-4 w-4" />,
    read: (v) => v.phone,
  },
  {
    label: "Location",
    step: 2,
    icon: <MapPin className="h-4 w-4" />,
    read: (v) => [v.state, v.country].filter(Boolean).join(", "),
  },
];

/** Show/hide control for a password input. */
function PasswordToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      className="boty-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
