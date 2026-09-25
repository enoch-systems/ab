"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const { session, authReady } = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicAuthPath =
    pathname === "/customer/login" ||
    pathname === "/customer/signup" ||
    pathname === "/customer/forgot-password";
  const isAuthed = session?.role === "customer";

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthed && !isPublicAuthPath) router.replace("/customer/login");
  }, [authReady, isAuthed, isPublicAuthPath, router]);

  if (isPublicAuthPath) return <>{children}</>;

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading session" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header variant="default" />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md boty-shadow border">
            <CardContent className="pt-10 pb-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="font-serif text-2xl mb-2">Customer Sign In Required</h1>
              <p className="text-muted-foreground mb-6">Please sign in to your customer account to view this page.</p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/">Home</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/customer/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="customer-shell relative min-h-screen flex flex-col bg-background text-foreground">
      <Header variant="customer" />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
}
