"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { toast } from "sonner";
import {
  Mail,
  Truck,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Demo flow: no customer auth backend wired yet — show confirmation.
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
      toast.success("Reset link sent", { description: "Check your inbox — it may take a minute to arrive." });
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

        <div className="relative z-10 mt-16 w-full max-w-md animate-blur-in">
          <Card className="boty-shadow relative overflow-hidden border border-border/80 bg-card/90 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />
            <CardHeader className="space-y-3 pb-5 text-center">
              <BrandLogo className="mx-auto h-12 w-12 rounded-xl object-contain" />
              <div className="space-y-1.5">
                <CardTitle className="font-serif text-2xl leading-tight sm:text-3xl">Reset your password</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Enter your account email and we&apos;ll send you a reset link.
                </CardDescription>
              </div>
            </CardHeader>

            {sent ? (
              <CardContent className="pb-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, a password
                  reset link is on its way. Check your inbox and spam folder.
                </p>
                <Button asChild variant="outline" className="boty-transition mt-5 h-10 w-full rounded-full">
                  <Link href="/customer/login">Back to Sign in</Link>
                </Button>
              </CardContent>
            ) : (
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
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t border-border/60 pt-5">
                  <Button type="submit" className="boty-transition h-10 w-full rounded-full shadow-lg shadow-primary/25" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/customer/login" className="font-medium text-primary underline-offset-4 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            )}
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
  icon,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="relative [&_input]:h-10 [&_input]:pl-10 [&_input]:rounded-lg sm:[&_input]:h-9">
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
