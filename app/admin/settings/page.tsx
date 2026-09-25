"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDateTime, formatMonthYear } from "@/components/shared/status-badge";
import {
  Activity,
  AlertTriangle,
  AtSign,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

type ProfileForm = { phone: string };

export default function AdminSettingsPage() {
  const router = useRouter();
  const { adminProfile, updateAdminProfile, changeAdminPassword, logout } = useAppState();
  const [profile, setProfile] = useState<ProfileForm>({ phone: adminProfile.phone ?? "" });
  const [editingPhone, setEditingPhone] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfile({ phone: adminProfile.phone ?? "" });
    setEditingPhone(false);
  }, [adminProfile]);

  const beginPhoneEdit = () => {
    setProfile({ phone: adminProfile.phone ?? "" });
    setEditingPhone(true);
  };

  const cancelPhoneEdit = () => {
    setProfile({ phone: adminProfile.phone ?? "" });
    setEditingPhone(false);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const result = await updateAdminProfile({ phone: profile.phone });
    setSavingProfile(false);
    if (!result.success) {
      toast.error("Could not save profile", { description: result.error });
      return;
    }
    setEditingPhone(false);
    toast.success("Profile updated", { description: "Your admin details are saved." });
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", { description: "Re-enter the new password confirmation." });
      return;
    }
    setSavingPassword(true);
    const result = await changeAdminPassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (!result.success) {
      toast.error("Could not change password", { description: result.error });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password changed", { description: "Use your new password the next time you sign in." });
  };

  const confirmLogout = async () => {
    await logout();
    toast.success("Signed out", { description: "Your admin session has ended." });
    router.replace("/admin/login");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl pb-10 sm:pb-14">
      <AdminPageHeader title="Admin settings" subtitle="Manage your admin identity, sign-in credentials, and session security." />

      <div className="space-y-5">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              <div className="min-w-0">
                <CardTitle className="font-serif text-xl">Profile details</CardTitle>
                <CardDescription className="mt-1">Review your admin identity. Supabase Auth controls sign-in identity; phone is editable here.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <div className="divide-y divide-border/60">
              <DetailRow icon={<UserRound className="h-4 w-4" />} label="Full name" value={adminProfile.name} />
              <DetailRow icon={<Mail className="h-4 w-4" />} label="Email address" value={adminProfile.email} />
              <DetailRow icon={<AtSign className="h-4 w-4" />} label="Username" value={adminProfile.username} />
              <div className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Phone className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Phone number</p>
                  {editingPhone ? (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="admin-phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(event) => setProfile({ phone: event.target.value })}
                        placeholder="Enter your phone number"
                        autoComplete="tel"
                        autoFocus
                      />
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" size="sm" onClick={saveProfile} disabled={savingProfile} className="rounded-lg">
                          {savingProfile ? <Activity className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {savingProfile ? "Saving…" : "Save profile"}
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={cancelPhoneEdit} disabled={savingProfile} aria-label="Cancel phone edit" className="rounded-lg">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{valueOrDash(adminProfile.phone)}</p>
                      <Button type="button" size="icon-sm" variant="ghost" onClick={beginPhoneEdit} aria-label="Edit phone number" title="Edit phone number" className="rounded-lg text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-px bg-border/60 sm:grid-cols-3">
                <SummaryCell icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={adminProfile.role === 'admin' ? 'Administrator' : null} />
                <SummaryCell icon={<CheckCircle2 className="h-4 w-4" />} label="Account status" value={adminProfile.accountStatus} />
                <SummaryCell icon={<CalendarDays className="h-4 w-4" />} label="Member since" value={adminProfile.createdAt ? formatMonthYear(adminProfile.createdAt) : null} />
              </div>
              <DetailRow icon={<Activity className="h-4 w-4" />} label="Last active" value={adminProfile.lastActive ? formatDateTime(adminProfile.lastActive) : null} hint="Last recorded profile activity" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><KeyRound className="h-5 w-5" /></div>
              <div className="min-w-0">
                <CardTitle className="font-serif text-xl">Change password</CardTitle>
                <CardDescription className="mt-1">Use at least 8 characters. Your new password will be required next time you sign in.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={savePassword} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField label="Current password" id="current-password" value={currentPassword} onChange={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent((value) => !value)} autoComplete="current-password" />
                <PasswordField label="New password" id="new-password" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew((value) => !value)} autoComplete="new-password" />
                <PasswordField label="Confirm new password" id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} autoComplete="new-password" />
              </div>
              <div className="flex justify-end border-t border-border/60 pt-4"><Button type="submit" variant="outline" disabled={savingPassword} className="rounded-xl"><ShieldCheck className="h-4 w-4" />{savingPassword ? "Updating…" : "Update password"}</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-destructive/25 bg-destructive/[0.03] shadow-sm">
          <CardHeader>
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><LogOut className="h-5 w-5" /></div>
              <div className="min-w-0">
                <CardTitle className="font-serif text-xl">Sign out of admin</CardTitle>
                <CardDescription className="mt-1">End this session and return to the admin sign-in screen.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-xl"><LogOut className="h-4 w-4" /> Log out</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Log out of ArcBest?</AlertDialogTitle>
                  <AlertDialogDescription>You will need to enter your admin username and password to access the operations console again.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmLogout} className="bg-destructive text-white hover:bg-destructive/90">Log out now</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function valueOrDash(value: string | null | undefined): string {
  return value?.trim() || '--';
}

function DetailRow({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | null | undefined; hint?: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{valueOrDash(value)}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function SummaryCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 bg-card px-6 py-4">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{valueOrDash(value)}</p>
      </div>
    </div>
  );
}

function PasswordField({ label, id, value, onChange, visible, onToggle, autoComplete }: { label: string; id: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; autoComplete: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><KeyRound className="h-4 w-4" />{label}</Label>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="pr-11" required />
        <button type="button" onClick={onToggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}