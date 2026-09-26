"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard, AuthField, AuthShell } from "@/components/shared/auth-shell";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail, MailCheck, KeyRound } from "lucide-react";

/**
 * Password reset request.
 *
 * Same shell as sign in and sign up so the three screens read as one flow: same
 * headline scale, same 48px fields, same button treatment. The confirmation
 * state names the address the link went to and offers a way back without a
 * browser-back tap.
 */
export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      // Demo flow: no reset backend wired yet — show the confirmation state.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSent(true);
      toast.success("Reset link sent", { description: "Check your inbox — it may take a minute to arrive." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell width="md">
      <AuthCard
        eyebrow={
          <>
            <KeyRound className="h-3.5 w-3.5" />
            Account recovery
          </>
        }
        title="Reset your password"
        description="Enter the email on your ArcBest account and we will send a one-time link to set a new password."
      >
        {sent ? (
          <div className="px-6 py-7 text-center sm:px-10 sm:py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MailCheck className="h-7 w-7" />
            </div>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              If an account exists for <span className="font-semibold text-foreground">{email}</span>, a reset link is on
              its way. It expires in 30 minutes — worth a look in your spam folder too.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="boty-transition h-12 flex-1 rounded-full text-sm">
                <Link href="/customer/login">Back to sign in</Link>
              </Button>
              <Button
                type="button"
                onClick={() => setSent(false)}
                className="boty-transition h-12 flex-1 rounded-full text-sm font-semibold shadow-lg shadow-primary/25"
              >
                <Mail className="h-4 w-4" />
                Send to another email
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="space-y-6 px-6 py-7 sm:px-10 sm:py-8">
              <AuthField
                label="Email address"
                htmlFor="email"
                icon={<Mail className="h-4 w-4" />}
                hint="We only send the link to the address on file."
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
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Locked out of the email inbox as well? Contact our team and a logistics specialist will verify your
                account another way.
              </p>
            </div>

            <div className="space-y-4 border-t border-border/60 bg-muted/20 px-6 py-6 sm:px-10 sm:py-7">
              <Button
                type="submit"
                disabled={loading}
                className="boty-transition h-12 w-full gap-2 rounded-full text-[15px] font-semibold shadow-lg shadow-primary/25"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                {loading ? "Sending…" : "Send reset link"}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link
                  href="/customer/login"
                  className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
