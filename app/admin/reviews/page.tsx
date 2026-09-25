"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";

export default function AdminReviewsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-16 text-center">
      <Card className="border rounded-2xl shadow-sm">
        <CardContent className="pt-10 pb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl mb-2">Redirecting…</h1>
          <p className="text-muted-foreground text-sm mb-5">
            The Reviews section is not used by this logistics platform.
          </p>
          <Button asChild className="rounded-full h-11">
            <Link href="/admin">
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
