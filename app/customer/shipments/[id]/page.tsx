"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, formatCurrency, formatDate, formatDateTime } from "@/components/shared/status-badge";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { Package, Truck, MapPin, ArrowLeft, Scale, Clock, Hash, User, Phone, Mail, ArrowRight, ChevronRight } from "lucide-react";

export default function CustomerShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const { shipments, session, findShipmentById } = useAppState();
  const shipment = findShipmentById(id);

  if (!shipment) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <Card className="boty-shadow border"><CardContent className="pt-10 pb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl mb-2">Shipment Not Found</h1>
          <p className="text-muted-foreground mb-6">The shipment you tried to open does not exist or was deleted.</p>
          <div className="flex justify-center gap-2">
            <Button asChild variant="outline" className="rounded-full"><Link href="/customer/shipments"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  if (shipment.customerId !== session?.userId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <Card className="boty-shadow border"><CardContent className="pt-10 pb-8">
          <h1 className="font-serif text-2xl mb-2">Unauthorized</h1>
          <p className="text-muted-foreground mb-6">This shipment belongs to another customer.</p>
          <Button asChild variant="outline" className="rounded-full"><Link href="/customer/shipments"><ArrowLeft className="w-4 h-4 mr-2" />Back to my shipments</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/customer/dashboard" className="hover:text-foreground transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/customer/shipments" className="hover:text-foreground transition">Shipments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-mono text-foreground">{shipment.trackingNumber}</span>
      </div>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Hash className="w-3 h-3" />
                <span className="font-mono">{shipment.trackingNumber}</span>
                <CopyTrackingId value={shipment.trackingNumber} />
              </span>
              <StatusBadge status={shipment.status} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl">Shipment Details</h1>
          </div>
        </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/track/${shipment.trackingNumber}`}>Public tracking <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
      </div>

      <div className="rounded-3xl boty-shadow border bg-card p-4 sm:p-6 mb-6">
        <RouteBar shipment={shipment} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <StatChip icon={<Truck className="w-4 h-4" />} label="Method" value={shipment.shippingMethod} />
          <StatChip icon={<Scale className="w-4 h-4" />} label="Weight" value={`${shipment.weight}kg`} />
          <StatChip icon={<Package className="w-4 h-4" />} label="Type" value={shipment.packageType} />
          <StatChip icon={<Clock className="w-4 h-4" />} label="ETA" value={formatDate(shipment.estimatedDelivery)} />
          <StatChip icon={<MapPin className="w-4 h-4" />} label="Current" value={shipment.currentLocation.split(",")[0]} />
          <StatChip icon={<Package className="w-4 h-4" />} label="Cost" value={formatCurrency(shipment.cost, shipment.currency)} />
        </div>
      </div>

      {shipment.images && shipment.images.length > 0 && <Card className="boty-shadow mb-6 border"><CardHeader><CardTitle className="font-serif text-lg">Product & packing images</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{shipment.images.map((image) => <a key={image.id} href={image.publicUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border"><img src={image.publicUrl} alt={image.altText} className="aspect-[4/3] w-full object-cover transition hover:scale-[1.02]" /></a>)}</div></CardContent></Card>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InfoCard title="Sender" icon={<User className="w-4 h-4" />}>
            <InfoRow label="Name" value={shipment.sender.name} />
            <InfoRow label="Phone" value={shipment.sender.phone} icon={<Phone className="w-3.5 h-3.5" />} />
            <InfoRow label="Email" value={shipment.sender.email} icon={<Mail className="w-3.5 h-3.5" />} />
            <InfoRow label="Address" value={`${shipment.sender.address}, ${shipment.sender.city}, ${shipment.sender.state}, ${shipment.sender.country}`} />
          </InfoCard>
          <InfoCard title="Recipient" icon={<User className="w-4 h-4" />}>
            <InfoRow label="Name" value={shipment.recipient.name} />
            <InfoRow label="Phone" value={shipment.recipient.phone} icon={<Phone className="w-3.5 h-3.5" />} />
            <InfoRow label="Email" value={shipment.recipient.email} icon={<Mail className="w-3.5 h-3.5" />} />
            <InfoRow label="Address" value={`${shipment.recipient.address}, ${shipment.recipient.city}, ${shipment.recipient.state}, ${shipment.recipient.country}`} />
          </InfoCard>
          <InfoCard title="Package & Cost" icon={<Package className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoRow label="Type" value={shipment.packageType} />
              <InfoRow label="Weight" value={`${shipment.weight} kg`} />
              <InfoRow label="Dimensions" value={shipment.dimensions} />
              <InfoRow label="Packages" value={String(shipment.packageCount)} />
              <InfoRow label="Method" value={shipment.shippingMethod} />
              <InfoRow label="Cost" value={formatCurrency(shipment.cost, shipment.currency)} />
            </div>
          </InfoCard>
        </div>
        <div className="lg:col-span-3">
          <Card className="boty-shadow border lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-xl">
                <span className="inline-flex w-8 h-8 rounded-lg bg-primary/10 text-primary items-center justify-center">
                  <Truck className="w-4 h-4" />
                </span>
                Tracking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrackingTimeline events={shipment.trackingEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/60 dark:bg-muted/20 p-3 sm:p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
        <span className="text-primary/80">{icon}</span>
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-semibold text-sm sm:text-base truncate">{value}</p>
    </div>
  );
}

function RouteBar({ shipment }: { shipment: any }) {
  const { sender, recipient, trackingEvents } = shipment;
  const origin = `${sender.city}, ${sender.country}`;
  const dest = `${recipient.city}, ${recipient.country}`;
  const completed = trackingEvents.filter((e: any) => e.state === "completed").length;
  const pct = Math.min(100, Math.round((completed / Math.max(trackingEvents.length - 1, 1)) * 100));
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
      <div className="text-left min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Origin</p>
        <p className="font-semibold text-sm sm:text-base truncate">{origin}</p>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 timeline-line rounded-full" style={{ width: `${pct}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center border-2 border-background transition-all duration-500"
          style={{ left: `calc(${pct}% - 14px)` }}
        >
          <Truck className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-right min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Destination</p>
        <p className="font-semibold text-sm sm:text-base truncate">{dest}</p>
      </div>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="boty-shadow border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-lg">
          <span className="inline-flex w-7 h-7 rounded-lg bg-primary/10 text-primary items-center justify-center">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
