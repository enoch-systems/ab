"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthShell,
  AuthTrustRow,
} from "@/components/shared/auth-shell";
import { useAppState } from "@/lib/app-state";
import { AuthSuccessOverlay, type AuthOverlayStage } from "@/components/shared/auth-success-overlay";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

/**
 * Customer sign in.
 *
 * This screen renders through the same auth shell as the signup wizard, so the
 * two sit at the same width, use the same 48px fields and the same headline
 * scale. Nothing here is decorative-only: every line of copy either explains a
 * field or says what happens after submit.
 */
const TRUST_ITEMS = [
  {
    icon: <PackageSearch className="h-4 w-4" />,
    label: "Live tracking",
    detail: "See each scan as your parcel moves",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Secure sign in",
    detail: "Session protected, sign out any time",
  },
  {
    icon: <RotateCcw className="h-4 w-4" />,
    label: "Quick rebooking",
    detail: "Repeat a previous shipment in seconds",
  },
];

export default function CustomerLoginPage() {
  const router = useRouter();
  const { customerLogin } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayStage, setOverlayStage] = useState<AuthOverlayStage>("working");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr("");
    setOverlayOpen(true);
    setOverlayStage("working");
    setLoading(true);
    try {
      const result = await customerLogin(email.trim(), password);
      if (result.success) {
        setOverlayStage("success");
        toast.success("Welcome back!", { description: "You are signed in to your customer dashboard." });
        setTimeout(() => router.push("/customer/dashboard"), 2300);
      } else {
        setOverlayOpen(false);
        setErr(result.error || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell width="md">
      <AuthCard
        eyebrow={
          <>
            <LogIn className="h-3.5 w-3.5" />
            Welcome back
          </>
        }
        title="Sign in to your shipping dashboard"
        description="Track parcels live, book pickups and manage deliveries — everything you shipped with ArcBest in one place."
      >
        <form onSubmit={submit} noValidate>
          <div className="space-y-6 px-6 py-7 sm:px-10 sm:py-8">
            <AuthField
              label="Email address"
              htmlFor="email"
              icon={<Mail className="h-4 w-4" />}
              hint="Use the email you signed up with."
            >
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                inputMode="email"
              />
            </AuthField>

            <AuthField
              label="Password"
              htmlFor="password"
              icon={<Lock className="h-4 w-4" />}
              hint="Passwords are case sensitive."
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="boty-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            >
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </AuthField>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-muted-foreground">
                On a shared computer? Sign out when you are finished.
              </p>
              <Link
                href="/customer/forgot-password"
                className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {err ? <AuthAlert>{err}</AuthAlert> : null}
          </div>

          <div className="space-y-4 border-t border-border/60 bg-muted/20 px-6 py-6 sm:px-10 sm:py-7">
            <Button
              type="submit"
              disabled={loading}
              className="boty-transition h-12 w-full gap-2 rounded-full text-[15px] font-semibold shadow-lg shadow-primary/25"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Signing in…" : "Sign in"}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
            <Button asChild variant="outline" className="boty-transition h-12 w-full gap-2 rounded-full text-sm">
              <Link href="/customer/signup">
                <UserPlus className="h-4 w-4" />
                Create an account
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to ArcBest? An account is free — you only pay when you ship.
            </p>
          </div>
        </form>
      </AuthCard>
      <AuthTrustRow items={TRUST_ITEMS} />
      <AuthSuccessOverlay
        open={overlayOpen}
        stage={overlayStage}
        kind="login"
        email={email.trim() || undefined}
        onContinue={() => router.push("/customer/dashboard")}
      />
    </AuthShell>
  );
}
