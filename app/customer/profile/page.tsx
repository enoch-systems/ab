"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { formatMonthYear } from '@/lib/date-format';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatDateTime } from "@/components/shared/status-badge";
import { toast } from "sonner";
import {
  UserCircle, Mail, Phone, MapPin, Globe2, Building2, Hash, CreditCard,
  CheckCircle2, ShieldCheck, ChevronLeft, Lock, Eye,
  EyeOff, LogOut, AlertTriangle, CalendarDays, BadgeCheck,
  KeyRound, Smartphone,
} from "lucide-react";

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: score === 0 ? "Too weak" : "Weak", color: "bg-destructive" };
  if (score === 3) return { score, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score, label: "Good", color: "bg-emerald-500" };
  return { score, label: "Strong", color: "bg-emerald-600" };
}

export default function CustomerProfilePage() {
  const { currentCustomer, updateCustomerProfile, changeCustomerPassword, logout } = useAppState();
  const cust = currentCustomer;

  const [activeTab, setActiveTab] = useState("details");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", company: "", address: "", country: "", state: "", city: "" });
  const [prefs, setPrefs] = useState({ notifyEmail: true, notifySms: true, notifyPush: false });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    if (!cust) return;
    setForm({ fullName: cust.fullName || "", email: cust.email || "", phone: cust.phone || "", company: cust.company || "", address: cust.address || "", country: cust.country || "", state: cust.state || "", city: cust.city || "" });
    setPrefs({ notifyEmail: cust.notifyEmail ?? true, notifySms: cust.notifySms ?? true, notifyPush: cust.notifyPush ?? false });
    setTwoFactor(cust.twoFactorEnabled ?? false);
    setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cust?.id]);

  if (!cust) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Card className="border border-border/60 bg-card/85">
          <CardContent className="pt-10 pb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-6 w-6" /></div>
            <h1 className="font-serif text-2xl">Sign in required</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please sign in to view your profile.</p>
            <Button asChild className="mt-6 rounded-full"><Link href="/customer/login">Sign In</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => { setForm((s) => ({ ...s, [k]: e.target.value })); setDirty(true); };
  const initials = cust.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  /* UTC-based so the server and the browser always print the same month. */
  const memberSince = formatMonthYear(cust.createdAt);
  const strength = passwordStrength(newPw);

  const saveProfile = () => {
    if (!form.fullName.trim()) { toast.error("Full name is required."); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { toast.error("Enter a valid email address."); return; }
    setSaving(true);
    try {
      const res = updateCustomerProfile(cust.id, { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), company: form.company.trim(), address: form.address.trim(), country: form.country.trim(), state: form.state.trim(), city: form.city.trim(), notifyEmail: prefs.notifyEmail, notifySms: prefs.notifySms, notifyPush: prefs.notifyPush, twoFactorEnabled: twoFactor });
      if (res.success) { toast.success("Profile updated successfully."); setDirty(false); }
      else toast.error(res.error || "Could not update profile.");
    } finally { setTimeout(() => setSaving(false), 400); }
  };

  const handlePasswordChange = () => {
    if (!currentPw) { toast.error("Enter your current password."); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { toast.error("New passwords do not match."); return; }
    setChangingPw(true);
    try {
      const res = changeCustomerPassword(cust.id, currentPw, newPw);
      if (res.success) { toast.success("Password changed successfully."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
      else toast.error(res.error || "Could not change password.");
    } finally { setTimeout(() => setChangingPw(false), 400); }
  };

  const toggle2FA = (v: boolean) => {
    setTwoFactor(v);
    const res = updateCustomerProfile(cust.id, { twoFactorEnabled: v });
    if (res.success) toast.success(v ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
    else { toast.error("Could not update 2FA setting."); setTwoFactor(!v); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4 h-9 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em]">
          <span className="text-muted-foreground">Account</span>
          <span className="text-muted-foreground/70">/</span>
          <span className="text-primary">Profile</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your personal details, address and account security.</p>
          </div>
          {dirty && (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.48fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border border-border/60 bg-card text-card-foreground shadow-[0_30px_60px_-32px_rgba(15,23,42,0.25)] dark:shadow-[0_30px_60px_-32px_rgba(0,0,0,0.6)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/8 to-muted px-5 pb-8 pt-6 text-foreground dark:from-primary/25 dark:via-primary/10 dark:to-slate-900 sm:px-6">
              <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-primary/10 blur-3xl dark:bg-white/5" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                  {initials || <UserCircle className="h-9 w-9" />}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-serif text-2xl leading-tight text-foreground">{cust.fullName}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{cust.email}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {cust.accountStatus}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground dark:bg-white/10 dark:text-slate-300">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      Member since {memberSince}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="-mt-6 space-y-4 pb-5">
              <div className="grid gap-3">
                <InfoRow label="Phone" value={cust.phone || "—"} />
                <InfoRow label="Address" value={[cust.address, cust.city, cust.state, cust.country].filter(Boolean).join(", ") || "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/85">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-serif text-xl">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Customer ID" value={cust.id.toUpperCase()} mono />
              <InfoRow label="Status" value={cust.accountStatus} />
              <InfoRow label="Registered" value={formatDate(cust.createdAt)} />
              <InfoRow label="Last Active" value={formatDateTime(cust.lastActive)} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border border-border/60 bg-card/85 shadow-[0_26px_60px_-34px_rgba(15,23,42,0.5)]">
            <CardHeader className="pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCircle className="h-4 w-4" />
                  </span>
                  Settings
                </CardTitle>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Personal</TabsTrigger>
                    <TabsTrigger value="address">Address</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <CardDescription className="mt-4 text-sm text-muted-foreground">
                {activeTab === "details" && "Your name, contact and company — used on labels, invoices and support lookups."}
                {activeTab === "address" && "Where pickups come from and how we reach you."}
                {activeTab === "security" && "Password, two-factor authentication and active sessions."}
              </CardDescription>
            </CardHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>

            <TabsContent value="details">
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Full Name" icon={<UserCircle className="h-4 w-4" />} hint="Appears on shipping labels">
                      <Input value={form.fullName} onChange={set("fullName")} className="h-11" autoComplete="name" />
                    </Field>
                    <Field label="Company (optional)" icon={<Building2 className="h-4 w-4" />} hint="For business shippers">
                      <Input value={form.company} onChange={set("company")} placeholder="e.g. Acme Inc." className="h-11" autoComplete="organization" />
                    </Field>
                    <Field label="Email" icon={<Mail className="h-4 w-4" />} hint="Login + receipts go here">
                      <Input type="email" value={form.email} onChange={set("email")} className="h-11" autoComplete="email" />
                    </Field>
                    <Field label="Phone" icon={<Phone className="h-4 w-4" />} hint="Courier + SMS updates">
                      <Input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="h-11" autoComplete="tel" />
                    </Field>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 pt-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="rounded-full h-10 px-5" asChild>
                    <Link href="/customer/dashboard">Cancel</Link>
                  </Button>
                  <Button className="rounded-full h-10 px-5" onClick={saveProfile} disabled={saving || !dirty}>
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="address">
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Address
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Country" icon={<Globe2 className="h-4 w-4" />}>
                        <Input value={form.country} onChange={set("country")} className="h-11 bg-background" autoComplete="country-name" />
                      </Field>
                      <Field label="State / Province" icon={<Building2 className="h-4 w-4" />}>
                        <Input value={form.state} onChange={set("state")} className="h-11 bg-background" autoComplete="address-level1" />
                      </Field>
                      <Field label="City" icon={<MapPin className="h-4 w-4" />}>
                        <Input value={form.city} onChange={set("city")} className="h-11 bg-background" autoComplete="address-level2" />
                      </Field>
                      <Field label="Street Address" icon={<Hash className="h-4 w-4" />}>
                        <Input value={form.address} onChange={set("address")} placeholder="Street + number" className="h-11 bg-background" autoComplete="street-address" />
                      </Field>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Contact preferences
                    </p>
                    <div className="divide-y divide-border/60">
                      <PrefRow title="Email updates" desc="Receipts and account notices" checked={prefs.notifyEmail} onChange={(v) => { setPrefs((p) => ({ ...p, notifyEmail: v })); setDirty(true); }} />
                      <PrefRow title="SMS updates" desc="Time-sensitive account alerts" checked={prefs.notifySms} onChange={(v) => { setPrefs((p) => ({ ...p, notifySms: v })); setDirty(true); }} />
                      <PrefRow title="Push notifications" desc="In-app alerts on this device" checked={prefs.notifyPush} onChange={(v) => { setPrefs((p) => ({ ...p, notifyPush: v })); setDirty(true); }} />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 pt-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="rounded-full h-10 px-5" asChild>
                    <Link href="/customer/dashboard">Cancel</Link>
                  </Button>
                  <Button className="rounded-full h-10 px-5" onClick={saveProfile} disabled={saving || !dirty}>
                    {saving ? "Saving…" : "Save Address"}
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="security">
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">Account security</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Signed in as <span className="font-medium text-foreground">{cust.email}</span>. Change your password regularly and enable 2FA for extra protection.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <KeyRound className="h-3.5 w-3.5 text-primary" /> Change password
                    </p>
                    <div className="grid gap-4">
                      <Field label="Current Password">
                        <div className="relative">
                          <Input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Enter current password" autoComplete="current-password" className="h-11 pr-11" />
                          <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showCurrent ? "Hide password" : "Show password"}>{showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                      </Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="New Password">
                          <div className="relative">
                            <Input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" className="h-11 pr-11" />
                            <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showNew ? "Hide password" : "Show password"}>{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                          </div>
                        </Field>
                        <Field label="Confirm New Password">
                          <div className="relative">
                            <Input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Retype new password" autoComplete="new-password" className="h-11 pr-11" />
                            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                          </div>
                        </Field>
                      </div>
                      {newPw && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Password strength</span><span className="font-medium text-foreground">{strength.label}</span></div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${Math.max(8, (strength.score / 5) * 100)}%` }} /></div>
                          {confirmPw && newPw !== confirmPw && (<p className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Passwords do not match</p>)}
                        </div>
                      )}
                      <div><Button className="h-10 rounded-full px-5" onClick={handlePasswordChange} disabled={changingPw || !currentPw || !newPw || !confirmPw}>{changingPw ? "Updating…" : "Update Password"}</Button></div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Smartphone className="h-4 w-4" /></span>
                      <div><p className="text-sm font-semibold text-foreground">Two-factor authentication</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Require a one-time code at sign-in. Recommended for frequent shippers.</p></div>
                    </div>
                    <Switch checked={twoFactor} onCheckedChange={toggle2FA} aria-label="Toggle two-factor authentication" />
                  </div>

                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 text-primary" /> Sessions
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-xs font-medium text-foreground">This device — current session</p>
                          <p className="text-[11px] text-muted-foreground">Last active {formatDateTime(cust.lastActive)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full" onClick={async () => { await logout(); toast.success("Signed out on this device."); }}>
                        <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 pt-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="rounded-full h-10 px-5" asChild>
                    <Link href="/customer/dashboard">Done</Link>
                  </Button>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, hint, children }: { label: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
      </Label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <div className={icon ? "[&>input]:pl-10 [&>input]:h-11" : ""}>{children}</div>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PrefRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`max-w-[58%] truncate text-sm font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
