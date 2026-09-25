'use client';

import { useMemo, useState } from 'react';
import { useAppState } from '@/lib/app-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminPageHeader } from '@/components/shared/admin/admin-page-header';
import { formatDateTime } from '@/components/shared/status-badge';
import { Inbox, Send, UserRound } from 'lucide-react';
import { richTrackingText } from '@/components/shared/copy-tracking-id';

export default function AdminInboxPage() {
  const { customers, getSupportMessages, sendSupportMessage, markSupportMessageRead } = useAppState();
  const [selectedId, setSelectedId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const selected = customers.find((customer) => customer.id === selectedId) ?? customers[0];
  const messages = useMemo(() => selected ? getSupportMessages(selected.id) : [], [getSupportMessages, selected]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSending(true);
    const result = await sendSupportMessage({ customerId: selected.id, subject, body });
    setSending(false);
    if (result.success) { setSubject(''); setBody(''); }
  };
  return <div className="mx-auto w-full max-w-[1400px] pb-12"><AdminPageHeader title="Inbox" subtitle="Support conversations with registered customers." /><div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"><Card className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" />Customers</CardTitle></CardHeader><CardContent className="space-y-1">{customers.map((customer) => <button type="button" key={customer.id} onClick={() => setSelectedId(customer.id)} className={`w-full rounded-xl p-3 text-left transition hover:bg-muted/40 ${selected?.id === customer.id ? 'bg-primary/10 ring-1 ring-primary/20' : ''}`}><p className="truncate text-sm font-semibold">{customer.fullName}</p><p className="truncate text-xs text-muted-foreground">{customer.email}</p></button>)}{!customers.length && <p className="py-8 text-center text-sm text-muted-foreground">No registered customers.</p>}</CardContent></Card><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" />{selected?.fullName || 'Select a customer'}</CardTitle></CardHeader><CardContent className="space-y-3">{selected ? messages.map((message) => <div key={message.id} onClick={() => void markSupportMessageRead(message.id)} className={`cursor-pointer w-full rounded-2xl border p-4 transition hover:bg-muted/30 ${message.readAt ? '' : 'border-primary/30 bg-primary/5'}`}><div className="flex items-center justify-between gap-3"><p className="min-w-0 flex-1 font-semibold">{message.subject}</p><span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{richTrackingText(message.body)}</p><p className="mt-3 text-xs font-medium text-primary">{message.senderRole === 'admin' ? 'You' : message.senderRole === 'customer' ? selected.fullName : 'System'}</p></div>) : <p className="py-12 text-center text-sm text-muted-foreground">Select a customer to view the conversation.</p>}</CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>Reply to {selected?.fullName || 'customer'}</CardTitle></CardHeader><CardContent><form onSubmit={send} className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="admin-subject">Subject</label><Input id="admin-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" required /></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="admin-body">Message</label><Textarea id="admin-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a support reply…" className="min-h-32" required /></div><Button type="submit" disabled={!selected || sending} className="w-full">{sending ? 'Sending…' : <><Send className="mr-2 h-4 w-4" />Send message</>}</Button></form></CardContent></Card></div></div></div>;
}
