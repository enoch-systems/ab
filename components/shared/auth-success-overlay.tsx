"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Lock, LogIn, MailCheck, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthSuccessKind = "login" | "signup" | "admin" | "verify-email";
export type AuthOverlayStage = "working" | "success";

type Copy = {
  icon: typeof LogIn;
  workingEyebrow: string;
  workingTitle: string;
  workingBlurb: string;
  steps: string[];
  successEyebrow: string;
  successTitle: string;
  successBlurb: string;
  redirectLabel: string;
};

const COPY: Record<AuthSuccessKind, Copy> = {
  login: {
    icon: LogIn,
    workingEyebrow: "Signing you in",
    workingTitle: "Verifying your credentials...",
    workingBlurb: "Checking your details and securing your session.",
    steps: ["Verifying credentials", "Securing your session", "Preparing your dashboard"],
    successEyebrow: "Login successful",
    successTitle: "Signed in successfully!",
    successBlurb: "Welcome back! Taking you to your shipping dashboard.",
    redirectLabel: "Redirecting to your dashboard",
  },
  signup: {
    icon: UserPlus,
    workingEyebrow: "Creating account",
    workingTitle: "Creating your account...",
    workingBlurb: "Setting up your profile and securing everything.",
    steps: ["Validating your details", "Creating your account", "Preparing your dashboard"],
    successEyebrow: "Signup successful",
    successTitle: "Account created successfully!",
    successBlurb: "Welcome to ArcBest! Taking you to your dashboard.",
    redirectLabel: "Redirecting to your dashboard",
  },
  admin: {
    icon: Lock,
    workingEyebrow: "Verifying access",
    workingTitle: "Verifying admin access...",
    workingBlurb: "Checking permissions and opening the control center.",
    steps: ["Verifying credentials", "Checking admin permissions", "Loading control center"],
    successEyebrow: "Access granted",
    successTitle: "Welcome back, Admin!",
    successBlurb: "Identity confirmed. Opening the operations control center.",
    redirectLabel: "Opening control center",
  },
  "verify-email": {
    icon: MailCheck,
    workingEyebrow: "Almost there",
    workingTitle: "Finishing up...",
    workingBlurb: "Saving the last details of your new account.",
    steps: ["Validating your details", "Creating your account", "Sending confirmation email"],
    successEyebrow: "Check your inbox",
    successTitle: "Account created successfully!",
    successBlurb: "We sent a confirmation link to your email. Confirm it, then sign in.",
    redirectLabel: "Taking you to sign in",
  },
};

const CONFETTI = ["#10b981", "#0b5fff", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899"];
export function AuthSuccessOverlay(props: {
  open: boolean;
  stage: AuthOverlayStage;
  kind?: AuthSuccessKind;
  email?: string;
  name?: string;
  onContinue?: () => void;
}) {
  const { open, stage, kind = "login", email, name, onContinue } = props;
  const copy = COPY[kind];
  const Icon = copy.icon;
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setActiveStep(0);
    } else {
      const t = window.setTimeout(() => setMounted(false), 280);
      return () => window.clearTimeout(t);
    }
  }, [open ]);

  useEffect(() => {
    if (!open || stage !== "working") return;
    const t1 = window.setTimeout(() => setActiveStep(1), 650);
    const t2 = window.setTimeout(() => setActiveStep(2), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open, stage]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open ]);
  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + 0.2;
        const dist = 74 + ((i * 37) % 54);
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 16,
          delay: 0.15 + ((i * 13) % 45) / 100,
          size: 5 + ((i * 29) % 50) / 10,
          color: CONFETTI[i % CONFETTI.length],
          round: i % 3 === 0,
        };
      }),
    []
  );

  if (!mounted && !open) return null;
  const firstName = (name ?? "").trim().split(" ")[0] ?? "";
  const isWorking = stage === "working";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isWorking ? copy.workingTitle : copy.successTitle}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4 transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-[#060B18]/70 backdrop-blur-md" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
      <div
        className={cn(
          "auth-overlay-card relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 bg-card text-card-foreground shadow-[0_32px_90px_-16px_rgb(0_0_0/0.55)] transition-all duration-300",
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.96] opacity-0"
        )}
      >
        <div aria-hidden="true" className="auth-overlay-sheen absolute inset-x-0 top-0 h-1.5" />
        <div className="relative px-7 pt-8 pb-7 text-center sm:px-8">
          {isWorking ? (
            <div key="working" className="auth-stage-enter">
              <div className="relative mx-auto grid h-24 w-24 place-items-center">
                <span aria-hidden="true" className="auth-halo absolute inset-0 rounded-full bg-primary/15" />
                <span aria-hidden="true" className="auth-ring absolute inset-0 rounded-full" />
                <span aria-hidden="true" className="absolute inset-[7px] rounded-full border border-border/70 bg-background/80" />
                <span className="relative grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
                <Loader2 className="h-3 w-3 animate-spin" />
                {copy.workingEyebrow}
              </p>
              <h2 className="mt-3 font-serif text-[1.6rem] leading-tight font-semibold tracking-tight">{copy.workingTitle}</h2>
              <p className="mx-auto mt-2 max-w-[26ch] text-sm leading-relaxed text-muted-foreground">{copy.workingBlurb}</p>
              <WorkSteps steps={copy.steps} activeStep={activeStep} />
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="auth-progress h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Please wait, securing everything...</p>
            </div>
          ) : (
            <SuccessBody kind={kind} copy={copy} email={email} firstName={firstName} confetti={confetti} onContinue={onContinue} />
          )}
        </div>
      </div>
    </div>
  );
}
function WorkSteps({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <ul className="mt-6 space-y-2 text-left">
      {steps.map((label, i) => {
        const passed = i < activeStep;
        const active = i === activeStep;
        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-all duration-300",
              passed
                ? "border-emerald-500/25 bg-emerald-500/8 text-foreground"
                : active
                  ? "border-primary/30 bg-primary/8 text-foreground shadow-sm"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-300",
                passed ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {label}
            {active && !passed ? <Dots /> : null}
            {passed ? <Check className="ml-auto h-4 w-4 text-emerald-500" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function Dots() {
  return (
    <span className="ml-auto flex gap-1" aria-hidden="true">
      <span className="auth-dot h-1 w-1 rounded-full bg-primary" />
      <span className="auth-dot auth-dot-2 h-1 w-1 rounded-full bg-primary" />
      <span className="auth-dot auth-dot-3 h-1 w-1 rounded-full bg-primary" />
    </span>
  );
}
function BurstDot({ p }: { p: { x: number; y: number; delay: number; size: number; color: string; round: boolean } }) {
  const style = {
    width: p.size,
    height: p.round ? p.size : p.size * 0.55,
    background: p.color,
    borderRadius: p.round ? 999 : 2,
    animationDelay: p.delay + "s",
  } as Record<string, string | number>;
  (style as Record<string, string>)["--cx"] = p.x + "px";
  (style as Record<string, string>)["--cy"] = p.y + "px";
  return <span className="auth-confetti absolute" style={style as React.CSSProperties} />;
}

function TickSvg() {
  return (
    <svg viewBox="0 0 100 100" className="auth-tick relative h-24 w-24" role="img" aria-label="Success checkmark">
      <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="auth-draw-circle" stroke="url(#authTickGrad)" strokeLinecap="round" />
      <path d="M32 51.5 44.5 64 69 39" fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="auth-draw-check" stroke="#10b981" />
      <defs>
        <linearGradient id="authTickGrad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SuccessBody(props: {
  kind: AuthSuccessKind;
  copy: Copy;
  email?: string;
  firstName: string;
  confetti: { x: number; y: number; delay: number; size: number; color: string; round: boolean }[];
  onContinue?: () => void;
}) {
  const { kind, copy, email, firstName, confetti, onContinue } = props;
  const msg = kind === "signup" && firstName ? "Welcome aboard, " + firstName + "! Your ArcBest account is ready." : copy.successBlurb;
  return (
    <div key="success" className="auth-stage-enter">
      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          {confetti.map((p, i) => (
            <BurstDot key={i} p={p} />
          ))}
        </div>
        <span aria-hidden="true" className="auth-success-halo absolute inset-0 rounded-full bg-emerald-500/15" />
        <TickSvg />
      </div>
      <p className="auth-pop mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-emerald-600 uppercase dark:text-emerald-400">
        <Sparkles className="h-3 w-3" />
        {copy.successEyebrow}
      </p>
      <h2 className="auth-pop auth-pop-2 mt-3 font-serif text-[1.7rem] leading-tight font-semibold tracking-tight">{copy.successTitle}</h2>
      <p className="auth-pop auth-pop-3 mx-auto mt-2 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">{msg}</p>
      {email ? (
        <p className="auth-pop auth-pop-3 mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-1.5 text-[13px] font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="truncate">{email}</span>
        </p>
      ) : null}
      <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5">
        <div className="flex items-center justify-center gap-2 text-[13px] font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {copy.redirectLabel}
          <Dots />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="auth-redirect h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-primary" />
        </div>
        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            className="mt-3 w-full cursor-pointer rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 active:scale-[0.99]"
          >
            Continue now
          </button>
        ) : null}
      </div>
    </div>
  );
}
