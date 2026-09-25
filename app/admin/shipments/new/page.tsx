'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppState } from '@/lib/app-state';
import { AdminPageHeader } from '@/components/shared/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ImagePlus, Loader2, PackagePlus, Send, ShieldCheck, UserRound } from 'lucide-react';
import type { Address, PackageType, ShippingMethod } from '@/lib/types';

const PACKAGE_TYPES: PackageType[] = ['Box', 'Envelope', 'Pallet', 'Crate', 'Tube'];
const METHODS: ShippingMethod[] = ['Standard', 'Express', 'Premium', 'International'];
const EMPTY_ADDRESS: Address = { name: '', phone: '', email: '', address: '', city: '', state: '', country: '' };

export default function AdminCreateShipmentPage() {
  const router = useRouter();
  const { customers, createAdminShipment } = useAppState();
  const [email, setEmail] = useState('');
  const [sender, setSender] = useState<Address>({ ...EMPTY_ADDRESS });
  const [recipient, setRecipient] = useState<Address>({ ...EMPTY_ADDRESS });
  const [packageType, setPackageType] = useState<PackageType>('Box');
  const [method, setMethod] = useState<ShippingMethod>('Standard');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [packageCount, setPackageCount] = useState('1');
  const [cost, setCost] = useState('');
  const [eta, setEta] = useState('');
  const [instructions, setInstructions] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const customer = useMemo(() => customers.find((item) => item.email.toLowerCase() === email.trim().toLowerCase()), [customers, email]);

  const setAddress = (key: keyof Address, value: string) => setSender((current) => ({ ...current, [key]: value }));
  const setRecipientField = (key: keyof Address, value: string) => setRecipient((current) => ({ ...current, [key]: value }));
  const chooseCustomer = (value: string) => {
    setEmail(value);
    const found = customers.find((item) => item.email.toLowerCase() === value.trim().toLowerCase());
    if (found) setRecipient({ name: found.fullName, phone: found.phone, email: found.email, address: found.address, city: found.city, state: found.state, country: found.country });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer) return toast.error('Select a registered customer email.');
    if (!sender.name || !sender.city || !sender.country || !recipient.name || !recipient.email || !recipient.city || !recipient.country) return toast.error('Complete the sender and recipient details.');
    if (!weight || Number(weight) <= 0 || !dimensions.trim() || !eta || cost === '' || Number(cost) < 0) return toast.error('Complete the package weight, dimensions, cost, and delivery date.');
    if (images.length < 1 || images.length > 3) return toast.error('Upload between 1 and 3 shipment images.');
    if (images.some((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) return toast.error('Each image must be an image under 5 MB.');
    setSaving(true);
    const result = await createAdminShipment({ customerEmail: customer.email, sender, recipient, packageType, shippingMethod: method, weight: Number(weight), dimensions: dimensions.trim(), packageCount: Math.max(1, Number(packageCount) || 1), cost: Number(cost), estimatedDelivery: new Date(`${eta}T12:00:00Z`).toISOString(), instructions: instructions.trim() || undefined, images });
    setSaving(false);
    if (!result.success) return toast.error(result.error || 'Shipment could not be created.');
    toast.success(`Shipment ${result.trackingNumber} created`, { description: 'The customer has been notified in their inbox.' });
    router.push(`/admin/shipments/${result.shipmentId}`);
  };

  return <div className="mx-auto w-full max-w-[1200px] pb-12"><AdminPageHeader title="Create shipment" subtitle="Create a tracked shipment for a registered customer." actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} /><form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-5"><Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Customer & addresses</CardTitle></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="customer-email">Registered customer email</Label><Input id="customer-email" list="customer-emails" type="email" value={email} onChange={(e) => chooseCustomer(e.target.value)} placeholder="Select or enter a customer email" required /><datalist id="customer-emails">{customers.map((item) => <option key={item.id} value={item.email}>{item.fullName}</option>)}</datalist>{customer ? <p className="text-xs text-emerald-600">Registered customer found: {customer.fullName}</p> : email ? <p className="text-xs text-rose-600">No registered customer matches this email.</p> : null}</div><AddressFields title="Sender / shipper" value={sender} onChange={setAddress} /><AddressFields title="Recipient" value={recipient} onChange={setRecipientField} /></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" />Package & service</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Package type"><select value={packageType} onChange={(e) => setPackageType(e.target.value as PackageType)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{PACKAGE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Shipping method"><select value={method} onChange={(e) => setMethod(e.target.value as ShippingMethod)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{METHODS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Weight (kg)"><Input type="number" min="0.01" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} required /></Field><Field label="Dimensions"><Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="40 × 30 × 20 cm" required /></Field><Field label="Package count"><Input type="number" min="1" value={packageCount} onChange={(e) => setPackageCount(e.target.value)} /></Field><Field label="Declared cost (USD)"><Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required /></Field><Field label="Estimated delivery"><Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} required /></Field><div className="sm:col-span-2 lg:col-span-2"><Label htmlFor="instructions">Handling instructions</Label><Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Optional packing or delivery instructions" className="mt-2 min-h-24" /></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" />Shipment images</CardTitle></CardHeader><CardContent><Label htmlFor="shipment-images">Upload 1–3 product or packing images</Label><Input id="shipment-images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2" onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 3))} /><p className="mt-2 text-xs text-muted-foreground">JPG, PNG, or WebP · maximum 5 MB each.</p><div className="mt-4 grid grid-cols-3 gap-3">{images.map((file, index) => <div key={`${file.name}-${index}`} className="overflow-hidden rounded-xl border"><img src={URL.createObjectURL(file)} alt="" className="aspect-square w-full object-cover" /><p className="truncate px-2 py-1 text-[10px] text-muted-foreground">{file.name}</p></div>)}</div></CardContent></Card>
  </div><Card className="h-fit lg:sticky lg:top-24"><CardHeader><CardTitle>Ready to create</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl bg-muted/40 p-4 text-sm"><p className="font-medium">{customer?.fullName || 'Select a customer'}</p><p className="mt-1 text-muted-foreground">{customer?.email || 'No customer selected'}</p></div><ul className="space-y-2 text-sm text-muted-foreground"><li>• Tracking ID generated automatically</li><li>• Customer inbox notification created</li><li>• Shipment email queued through Resend</li><li>• Images stored in secure Supabase Storage</li></ul><Button type="submit" disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{saving ? 'Creating shipment…' : 'Create shipment'}</Button><p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Only administrators can create or change shipment records.</p></CardContent></Card></form></div>;
}

function AddressFields({ title, value, onChange }: { title: string; value: Address; onChange: (key: keyof Address, value: string) => void }) {
  return <fieldset className="rounded-xl border p-4"><legend className="px-1 text-sm font-semibold">{title}</legend><div className="grid gap-3 sm:grid-cols-2"><Field label="Full name"><Input value={value.name} onChange={(e) => onChange('name', e.target.value)} required /></Field><Field label="Phone"><Input value={value.phone} onChange={(e) => onChange('phone', e.target.value)} /></Field><Field label="Email"><Input type="email" value={value.email} onChange={(e) => onChange('email', e.target.value)} /></Field><Field label="Street address"><Input value={value.address} onChange={(e) => onChange('address', e.target.value)} /></Field><Field label="City"><Input value={value.city} onChange={(e) => onChange('city', e.target.value)} required /></Field><Field label="State / region"><Input value={value.state} onChange={(e) => onChange('state', e.target.value)} /></Field><Field label="Country"><Input value={value.country} onChange={(e) => onChange('country', e.target.value)} required /></Field></div></fieldset>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
