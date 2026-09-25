"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Truck,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const { customerLogin } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const result = await customerLogin(email.trim(), password);
      if (result.success) {
        toast.success("Welcome back!", { description: "You are signed in to your customer dashboard." });
        setTimeout(() => router.push("/customer/dashboard"), 300);
      } else {
        setErr(result.error || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-shell min-h-screen flex flex-col bg-background text-foreground">
      <Header variant="default" />
      <main className="relative flex-1 overflow-hidden flex items-center justify-center px-4 py-6 sm:py-10 lg:py-14">
        {/* Decorative backdrop */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="ops-auth-grid absolute inset-0" />
          <div className="absolute -top-32 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>
          {/* Sign in */}
          <div className="relative z-10 mt-16 w-full max-w-md animate-blur-in">
            <Card className="boty-shadow relative overflow-hidden border border-border/80 bg-card/90 backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />
              <CardHeader className="space-y-3 pb-5 text-center">
                <BrandLogo className="mx-auto h-12 w-12 rounded-xl object-contain" />
                <div className="space-y-1.5">
                  <CardTitle className="font-serif text-2xl leading-tight sm:text-3xl">Sign in to your shipping dashboard</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Track parcels live, book pickups and manage deliveries.
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={submit}>
                <CardContent className="space-y-5">
                  <Field label="Email" htmlFor="email" icon={<Mail className="w-4 h-4" />}>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      inputMode="email"
                    />
                  </Field>

                  <Field
                    label="Password"
                    htmlFor="password"
                    icon={<Lock className="w-4 h-4" />}
                    labelAction={
                      <Link
                        href="/customer/forgot-password"
                        className="text-xs normal-case tracking-normal text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    }
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="boty-transition flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  >
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                  </Field>

                  {err && (
                    <div
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                      role="alert"
                    >
                      {err}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex-col gap-3 border-t border-border/60 pt-5">
                  <Button type="submit" className="boty-transition mt-2 h-10 w-full rounded-full sm:h-9" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New here?{" "}
                    <Link
                      href="/customer/signup"
                      className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                    >
                      Create account
                    </Link>{" "}
                    to get started.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  labelAction,
  icon,
  trailing,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  labelAction?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {labelAction}
      </div>
      <div className={cn("relative [&_input]:h-10 [&_input]:pl-10 [&_input]:rounded-lg sm:[&_input]:h-9", trailing && "[&_input]:pr-10")}>
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
        ) : null}
        {children}
        {trailing ? <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div> : null}
      </div>
    </div>
  );
}
