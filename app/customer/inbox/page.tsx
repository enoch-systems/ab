"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/components/shared/status-badge";
import { Inbox, ChevronLeft, ChevronDown, ShieldCheck } from "lucide-react";
import { richTrackingText } from "@/components/shared/copy-tracking-id";
import { cn } from "@/lib/utils";

export default function CustomerInboxPage() {
  const { session, getSupportMessages, markSupportMessageRead } = useAppState();
  const messages = useMemo(
    () => (session ? getSupportMessages(session.userId) : []),
    [session, getSupportMessages]
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string, readAt: string | null | undefined) => {
    setOpenId((c) => (c === id ? null : id));
    if (!readAt) void markSupportMessageRead(id);
  };
  return <InboxView messages={messages} openId={openId} toggle={toggle} />;
}

function InboxView({ messages, openId, toggle }: {
  messages: ReturnType<ReturnType<typeof useAppState>["getSupportMessages"]>;
  openId: string | null;
  toggle: (id: string, readAt: string | null | undefined) => void;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="mb-5 sm:mb-6">
        <Button asChild variant="ghost" className="mb-3 h-9 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground sm:mb-4">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Back
          </Link>
        </Button>
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">Account</p>
            <h1 className="mt-1 font-serif text-[1.7rem] leading-tight sm:text-3xl">Support inbox</h1>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Messages from ArcBest about your account and shipments.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </div>
        </div>
      </div>
      <Card className="min-w-0 border">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex min-w-0 items-center gap-2">
            <Inbox className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate">Messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-2.5 px-3 sm:space-y-3 sm:px-6">
          {!messages.length ? (
            <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No support messages yet.
            </p>
          ) : (
            messages.map((m) => {
              const open = openId === m.id;
              const unread = !m.readAt;
              return (
                <div key={m.id} className={cn("min-w-0 rounded-2xl border", unread ? "border-primary/30 bg-primary/5" : "border-border/70")}>
                  <button type="button" onClick={() => toggle(m.id, m.readAt)} aria-expanded={open} className="flex w-full min-w-0 cursor-pointer items-center gap-3 px-3 py-3.5 text-left sm:px-4">
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{m.subject}</span>
                        {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                  </button>
                  {open && (
                    <div className="min-w-0 border-t border-border/60 px-3 py-4 sm:px-4">
                      <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{richTrackingText(m.body)}</p>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        {m.senderRole === "admin" ? "ArcBest support" : m.senderRole === "system" ? "ArcBest system" : "You"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
