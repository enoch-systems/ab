"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { AdminShell } from "@/components/shared/admin/admin-shell";
import { Loader2, Shield, Lock } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, authReady } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicAuthPath = ["/admin/login", "/admin/forgot-password", "/admin/update-password"].includes(pathname);
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!authReady) return;
    if (!isAdmin && !isPublicAuthPath) router.replace("/admin/login");
  }, [authReady, isAdmin, isPublicAuthPath, router]);

  if (isPublicAuthPath) return <>{children}</>;

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground ops-auth-grid">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading session" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground ops-auth-grid">
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl">
            <div className="px-6 pb-8 pt-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h1 className="mb-2 font-serif text-2xl">Admin Access Required</h1>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                This area is restricted to administrators. Please sign in to continue.
              </p>
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-accent/10">
                  Back to Home
                </Link>
                <Link href="/admin/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/92">
                  <Lock className="h-4 w-4" /> Admin Sign In
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
