'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/app-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/components/shared/status-badge';
import { Inbox, Send, ShieldCheck, UserRound } from 'lucide-react';
import { richTrackingText } from '@/components/shared/copy-tracking-id';

export default function CustomerInboxPage() {
  const { session, getSupportMessages, sendSupportMessage, markSupportMessageRead } = useAppState();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const messages = session ? getSupportMessages(session.userId) : [];
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setSending(true);
    const result = await sendSupportMessage({ customerId: session.userId, subject, body });
    setSending(false);
    if (!result.success) return;
    setSubject(''); setBody('');
  };
  return <div className="mx-auto max-w-5xl px-4 py-8"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Account</p><h1 className="mt-1 font-serif text-3xl">Support inbox</h1><p className="mt-1 text-sm text-muted-foreground">Messages from ArcBest about your account and shipments.</p></div><div className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">{messages.length} messages</div></div><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" />Messages</CardTitle></CardHeader><CardContent className="space-y-3">{!messages.length ? <p className="py-12 text-center text-sm text-muted-foreground">No support messages yet.</p> : messages.map((message) => <div key={message.id} onClick={() => void markSupportMessageRead(message.id)} className={`cursor-pointer w-full rounded-2xl border p-4 transition hover:bg-muted/30 ${message.readAt ? '' : 'border-primary/30 bg-primary/5'}`}><div className="flex items-center justify-between gap-3"><p className="min-w-0 flex-1 font-semibold">{message.subject}</p><span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{richTrackingText(message.body)}</p><p className="mt-3 text-xs font-medium text-primary">{message.senderRole === 'admin' ? 'ArcBest support' : message.senderRole === 'system' ? 'ArcBest system' : 'You'}</p></div>)}</CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>Contact support</CardTitle></CardHeader><CardContent><form onSubmit={send} className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="support-subject">Subject</label><Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="How can we help?" required /></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="support-body">Message</label><Textarea id="support-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message…" className="min-h-32" required /></div><Button type="submit" disabled={sending} className="w-full">{sending ? 'Sending…' : <><Send className="mr-2 h-4 w-4" />Send message</>}</Button><p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Your messages are private to you and the ArcBest support team.</p></form></CardContent></Card></div></div>;
}
