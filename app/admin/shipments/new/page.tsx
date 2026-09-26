'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppState } from '@/lib/app-state';
import { AdminPageHeader } from '@/components/shared/admin/admin-page-header';
import { CustomerCombobox } from '@/components/shared/admin/customer-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, ImagePlus, Loader2, PackagePlus, Send, ShieldCheck, UserRound, X, Mail, BellRing, Boxes, HardDrive, Upload, Check, Images } from 'lucide-react';
import type { Address, PackageType, ShippingMethod } from '@/lib/types';

const PACKAGE_TYPES: PackageType[] = ['Box', 'Envelope', 'Pallet', 'Crate', 'Tube'];
const METHODS: ShippingMethod[] = ['Standard', 'Express', 'Premium', 'International'];
const EMPTY_ADDRESS: Address = { name: '', phone: '', email: '', address: '', city: '', state: '', country: '' };
const MAX_IMAGES = 3;
const MAX_BYTES = 5 * 1024 * 1024;

/* Shared control sizing so selects, inputs and the date picker line up and
   keep a 44px touch target on phones. */
const CONTROL =
  'h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:h-10';

/* Identifies a file well enough to stop the same photo being added twice. */
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

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
  const [dragging, setDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const customer = useMemo(
    () => customers.find((item) => item.email.toLowerCase() === email.trim().toLowerCase()),
    [customers, email],
  );

  /* Object URLs are created and revoked in an effect: doing it during render
     leaks a fresh blob URL on every keystroke and makes previews flicker. */
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const setAddress = (key: keyof Address, value: string) => setSender((current) => ({ ...current, [key]: value }));
  const setRecipientField = (key: keyof Address, value: string) => setRecipient((current) => ({ ...current, [key]: value }));

  const chooseCustomer = (value: string) => {
    setEmail(value);
    const found = customers.find((item) => item.email.toLowerCase() === value.trim().toLowerCase());
    if (found) {
      setRecipient({
        name: found.fullName,
        phone: found.phone,
        email: found.email,
        address: found.address,
        city: found.city,
        state: found.state,
        country: found.country,
      });
    }
  };

  /* Accepts 1 to MAX_IMAGES files in one go. Each file is validated on its own so
     a single bad file never blocks the good ones alongside it. */
  const addImages = (list: FileList | File[] | null) => {
    if (!list) return;
    const picked = Array.from(list);
    if (picked.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images. Remove one to swap it.`);
      return;
    }

    const rejected: string[] = [];
    const accepted: File[] = [];
    const seen = new Set(images.map(fileKey));

    for (const file of picked) {
      const key = fileKey(file);
      if (seen.has(key)) {
        rejected.push(`${file.name} (already added)`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        rejected.push(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name} is larger than 5 MB`);
        continue;
      }
      seen.add(key);
      accepted.push(file);
    }

    const overflow = accepted.length - room;
    const kept = overflow > 0 ? accepted.slice(0, room) : accepted;
    if (kept.length > 0) setImages((current) => [...current, ...kept]);

    if (kept.length === 0) {
      toast.error(rejected[0] ?? 'Those files could not be attached.');
      return;
    }
    if (overflow > 0) {
      toast.warning(`Added ${kept.length}. Only ${MAX_IMAGES} images are allowed — ${overflow} skipped.`);
    } else if (rejected.length > 0) {
      toast.warning(`Added ${kept.length}, skipped ${rejected.length}: ${rejected[0]}`);
    } else {
      toast.success(kept.length === 1 ? '1 image added.' : `${kept.length} images added.`);
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
    toast.success('Image removed.');
  };

  const openPicker = () => imageInputRef.current?.click();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer) return toast.error('Select a registered customer email.');
    if (!sender.name || !sender.city || !sender.country || !recipient.name || !recipient.email || !recipient.city || !recipient.country) {
      return toast.error('Complete the sender and recipient details.');
    }
    if (!weight || Number(weight) <= 0 || !dimensions.trim() || !eta || cost === '' || Number(cost) < 0) {
      return toast.error('Complete the package weight, dimensions, cost, and delivery date.');
    }
    if (images.length < 1 || images.length > MAX_IMAGES) return toast.error('Upload between 1 and 3 shipment images.');
    setSaving(true);
    const result = await createAdminShipment({
      customerEmail: customer.email,
      sender,
      recipient,
      packageType,
      shippingMethod: method,
      weight: Number(weight),
      dimensions: dimensions.trim(),
      packageCount: Math.max(1, Number(packageCount) || 1),
      cost: Number(cost),
      estimatedDelivery: new Date(`${eta}T12:00:00Z`).toISOString(),
      instructions: instructions.trim() || undefined,
      images,
    });
    setSaving(false);
    if (!result.success) return toast.error(result.error || 'Shipment could not be created.');
    toast.success(`Shipment ${result.trackingNumber} created`, {
      description: 'The customer has been notified in their inbox.',
    });
    router.push(`/admin/shipments/${result.shipmentId}`);
  };

  const checklist = [
    { icon: Boxes, text: 'Tracking ID generated automatically' },
    { icon: BellRing, text: 'Customer inbox notification created' },
    { icon: Mail, text: 'Shipment email queued through Resend' },
    { icon: HardDrive, text: 'Images stored in secure Supabase Storage' },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] pb-4">
      <AdminPageHeader
        title="Create shipment"
        subtitle="Create a tracked shipment for a registered customer."
        actions={
          <Button variant="outline" onClick={() => router.back()} className="h-10 w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
            Back
          </Button>
        }
      />

      <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserRound className="h-5 w-5 shrink-0 text-primary" />
                Customer &amp; addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <CustomerCombobox
                customers={customers}
                value={email}
                onChange={chooseCustomer}
                selected={customer}
              />

              <AddressFields id="sender" title="Sender / shipper" value={sender} onChange={setAddress} />
              <AddressFields id="recipient" title="Recipient" value={recipient} onChange={setRecipientField} />
            </CardContent>
          </Card>


          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <PackagePlus className="h-5 w-5 shrink-0 text-primary" />
                Package &amp; service
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="package-type" label="Package type">
                <select
                  id="package-type"
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as PackageType)}
                  className={CONTROL}
                >
                  {PACKAGE_TYPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field id="shipping-method" label="Shipping method">
                <select
                  id="shipping-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ShippingMethod)}
                  className={CONTROL}
                >
                  {METHODS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field id="weight" label="Weight (kg)">
                <Input id="weight" type="number" inputMode="decimal" min="0.01" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} className={CONTROL} required />
              </Field>
              <Field id="dimensions" label="Dimensions">
                <Input id="dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="40 × 30 × 20 cm" className={CONTROL} required />
              </Field>
              <Field id="package-count" label="Package count">
                <Input id="package-count" type="number" inputMode="numeric" min="1" value={packageCount} onChange={(e) => setPackageCount(e.target.value)} className={CONTROL} />
              </Field>
              <Field id="cost" label="Declared cost (USD)">
                <Input id="cost" type="number" inputMode="decimal" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className={CONTROL} required />
              </Field>
              <Field id="eta" label="Estimated delivery" className="sm:col-span-2">
                <Input id="eta" type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={CONTROL} required />
              </Field>
              <div className="sm:col-span-2">
                <Label htmlFor="instructions">Handling instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Optional packing or delivery instructions"
                  className="mt-2 min-h-24 w-full min-w-0 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ImagePlus className="h-5 w-5 shrink-0 text-primary" />
                Shipment images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add {1}–{MAX_IMAGES} product or packing images. Drag them in, or tap to browse. JPG, PNG or WebP, 5&nbsp;MB max each.
              </p>

              {/* Progress strip: always shows how close the set is to the 3-image limit. */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: MAX_IMAGES }).map((_, slot) => (
                    <span
                      key={slot}
                      className={cn(
                        'h-1.5 w-9 rounded-full transition-colors duration-300 sm:w-12',
                        slot < images.length ? 'bg-primary' : 'bg-muted',
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {images.length} of {MAX_IMAGES} added
                </p>
              </div>

              {/* Native file inputs render as a tiny "No file chosen" control on
                  mobile, so the real input is hidden behind a full-width target. */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addImages(e.dataTransfer.files);
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200',
                  dragging
                    ? 'scale-[1.01] border-primary bg-primary/10'
                    : 'border-border bg-muted/20 hover:border-primary/60 hover:bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200',
                    dragging ? 'scale-110 bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
                  )}
                >
                  {dragging ? <Upload className="h-6 w-6 animate-bounce" /> : <Images className="h-6 w-6" />}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {dragging
                    ? 'Drop to add images'
                    : images.length === 0
                      ? 'Drag & drop images here'
                      : 'Drop more images, or add below'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {images.length >= MAX_IMAGES
                    ? 'Limit reached — remove one to swap it out'
                    : `Select 1 to ${MAX_IMAGES} at once`}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={images.length >= MAX_IMAGES}
                  onClick={openPicker}
                  className="mt-1 h-11 w-full cursor-pointer sm:h-9 sm:w-auto"
                >
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  {images.length === 0 ? 'Choose images' : 'Add more'}
                </Button>
                <Input
                  ref={imageInputRef}
                  id="shipment-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {images.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((file, index) => (
                    <li
                      key={fileKey(file)}
                      className="group relative min-w-0 overflow-hidden rounded-xl border bg-muted/30 transition-shadow hover:shadow-md"
                    >
                      <div className="relative">
                        {previews[index] ? (
                          <img
                            src={previews[index]}
                            alt={file.name}
                            className="aspect-square w-full animate-in object-cover fade-in duration-300"
                          />
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center text-muted-foreground">
                            <ImagePlus className="h-6 w-6" />
                          </div>
                        )}
                        <span className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          aria-label={`Remove ${file.name}`}
                          className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 border-t px-2 py-1.5">
                        <p className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground" title={file.name}>
                          {file.name}
                        </p>
                        <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Fills the remaining slot so it stays obvious more can be added. */}
              {images.length > 0 && images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:bg-primary/5 hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  Add {MAX_IMAGES - images.length} more image{MAX_IMAGES - images.length > 1 ? 's' : ''}
                </button>
              )}

              {images.length > 0 && (
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  {images.length} image{images.length > 1 ? 's' : ''} ready to upload
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0 lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Ready to create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-w-0 rounded-xl bg-muted/40 p-4 text-sm">
              <p className="break-words font-medium text-foreground">{customer?.fullName || 'Select a customer'}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground sm:text-sm">
                {customer?.email || 'No customer selected'}
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {checklist.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">{text}</span>
                </li>
              ))}
            </ul>

            <Button type="submit" disabled={saving} className="h-11 w-full sm:h-10">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  Creating shipment…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4 shrink-0" />
                  Create shipment
                </>
              )}
            </Button>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0 break-words">Only administrators can create or change shipment records.</span>
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function AddressFields({
  id,
  title,
  value,
  onChange,
}: {
  id: string;
  title: string;
  value: Address;
  onChange: (key: keyof Address, value: string) => void;
}) {
  return (
    <fieldset className="min-w-0 rounded-xl border p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Full name">
          <Input id={`${id}-name`} autoComplete="name" value={value.name} onChange={(e) => onChange('name', e.target.value)} className={CONTROL} required />
        </Field>
        <Field id={`${id}-phone`} label="Phone">
          <Input id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={value.phone} onChange={(e) => onChange('phone', e.target.value)} className={CONTROL} />
        </Field>
        <Field id={`${id}-email`} label="Email" className="sm:col-span-2">
          <Input id={`${id}-email`} type="email" inputMode="email" autoComplete="email" value={value.email} onChange={(e) => onChange('email', e.target.value)} className={CONTROL} />
        </Field>
        <Field id={`${id}-address`} label="Street address" className="sm:col-span-2">
          <Input id={`${id}-address`} autoComplete="street-address" value={value.address} onChange={(e) => onChange('address', e.target.value)} className={CONTROL} />
        </Field>
        <Field id={`${id}-city`} label="City">
          <Input id={`${id}-city`} autoComplete="address-level2" value={value.city} onChange={(e) => onChange('city', e.target.value)} className={CONTROL} required />
        </Field>
        <Field id={`${id}-state`} label="State / region">
          <Input id={`${id}-state`} autoComplete="address-level1" value={value.state} onChange={(e) => onChange('state', e.target.value)} className={CONTROL} />
        </Field>
        <Field id={`${id}-country`} label="Country" className="sm:col-span-2">
          <Input id={`${id}-country`} autoComplete="country-name" value={value.country} onChange={(e) => onChange('country', e.target.value)} className={CONTROL} required />
        </Field>
      </div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      {children}
    </div>
  );
}



