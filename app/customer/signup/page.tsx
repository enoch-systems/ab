"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Country, State } from "country-state-city";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PolicyModal } from "@/components/shared/policy-modal";
import { BrandLogo } from "@/components/shared/brand-logo";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  User,
  Mail,
  Phone,
  Lock,
  Globe2,
  MapPin,
  Eye,
  EyeOff,
  ChevronsUpDown,
  Check,
  Truck,
} from "lucide-react";

export default function CustomerSignupPage() {
  const router = useRouter();
  const { customerSignup } = useAppState();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "US",
    state: "",
  });
  const [phoneCode, setPhoneCode] = useState("+1");
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [phoneCodeSearch, setPhoneCodeSearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [policy, setPolicy] = useState<"terms" | "privacy" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(form.country), [form.country]);
  const selectedCountry = countries.find((country) => country.isoCode === form.country);
  const filteredCountries = countries.filter((country) => {
    const search = countrySearch.toLowerCase().trim();
    return !search || country.name.toLowerCase().includes(search) || country.isoCode.toLowerCase().includes(search);
  });
  const filteredStates = states.filter((state) => {
    const search = stateSearch.toLowerCase().trim();
    return !search || state.name.toLowerCase().includes(search) || state.isoCode.toLowerCase().includes(search);
  });
  const filteredPhoneCountries = countries.filter((country) => {
    const search = phoneCodeSearch.toLowerCase().trim();
    return !search || country.name.toLowerCase().includes(search) || country.phonecode.includes(search);
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (form.password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setErr("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!form.fullName || !form.email || !form.phone || !form.state || !form.country) {
      setErr("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const cust = await customerSignup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: `${phoneCode} ${form.phone.trim()}`,
        password: form.password,
        address: "",
        country: selectedCountry?.name ?? form.country,
        state: states.find((state) => state.isoCode === form.state)?.name ?? form.state,
        city: "",
      });
      if (cust.success) {
        if (cust.requiresEmailConfirmation) {
          toast.success("Check your email to confirm your account.", {
            description: "Your account is ready. Confirm your email, then sign in to continue.",
          });
          setTimeout(() => router.push("/customer/login"), 500);
        } else {
          toast.success("Account created!", { description: "Welcome to ArcBest. You are now signed in." });
          setTimeout(() => router.push("/customer/dashboard"), 300);
        }
      } else {
        setErr(cust.error || "Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-shell min-h-screen flex flex-col bg-background text-foreground">
      <Header variant="default" />
      <main className="relative flex-1 overflow-hidden flex items-center justify-center px-4 py-6 sm:py-10 lg:py-14">
        {/* Decorative backdrop */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="ops-auth-grid absolute inset-0" />
          <div className="absolute -top-32 left-1/2 h-80 w-2xl -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 mt-16 w-full max-w-md animate-blur-in">
          <Card className="boty-shadow relative overflow-hidden border border-border/80 bg-card/90 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />
            <CardHeader className="space-y-3 pb-5 text-center">
              <BrandLogo className="mx-auto h-12 w-12 rounded-xl object-contain" />
              <div className="space-y-1.5">
                <CardTitle className="font-serif text-2xl leading-tight sm:text-3xl">Create free account</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Create your shipper account — free forever. Book pickups, track parcels & insure cargo.
                </CardDescription>
              </div>
            </CardHeader>

              <form onSubmit={submit}>
                <CardContent className="space-y-4">
                  <Field label="Full Name" htmlFor="fullName" icon={<User className="w-4 h-4" />}>
                    <Input id="fullName" value={form.fullName} onChange={set("fullName")} placeholder="e.g. Jordan Williams" required autoComplete="name" />
                  </Field>
                  <Field label="Email Address" htmlFor="email" icon={<Mail className="w-4 h-4" />}>
                    <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required autoComplete="email" inputMode="email" />
                  </Field>
                  <Field label="Phone Number" htmlFor="phone">
                    <div className="flex gap-2 [&_input]:h-10 sm:[&_input]:h-9">
                      <CodePicker
                        value={phoneCode}
                        leadingIcon={<Phone className="h-4 w-4 shrink-0" />}
                        search={phoneCodeSearch}
                        open={phoneCodeOpen}
                        options={filteredPhoneCountries}
                        onSearch={setPhoneCodeSearch}
                        onOpenChange={setPhoneCodeOpen}
                        onSelect={(country) => {
                          setPhoneCode(country.phonecode);
                          setPhoneCodeOpen(false);
                          setPhoneCodeSearch("");
                        }}
                      />
                      <Input id="phone" className="pl-3! min-w-0 flex-1" value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" required autoComplete="tel-national" inputMode="tel" />
                    </div>
                  </Field>
                  <Field label="Country" htmlFor="country">
                    <SearchPicker
                      value={selectedCountry?.name ?? "Select country"}
                      placeholder="Search countries..."
                      leadingIcon={<Globe2 className="h-4 w-4 shrink-0" />}
                      open={countryOpen}
                      search={countrySearch}
                      disabled={loading}
                      options={filteredCountries.map((country) => ({ value: country.isoCode, label: country.name, detail: country.isoCode }))}
                      onSearch={setCountrySearch}
                      onOpenChange={setCountryOpen}
                      onSelect={(value) => {
                        setForm((current) => ({ ...current, country: value, state: "" }));
                        setCountryOpen(false);
                        setCountrySearch("");
                      }}
                    />
                  </Field>
                  <Field label="State / Region" htmlFor="state">
                    <SearchPicker
                      value={states.find((state) => state.isoCode === form.state)?.name ?? "Select state / region"}
                      placeholder={form.country ? "Search states / regions..." : "Select a country first"}
                      leadingIcon={<MapPin className="h-4 w-4 shrink-0" />}
                      open={stateOpen}
                      search={stateSearch}
                      disabled={!form.country || states.length === 0 || loading}
                      options={filteredStates.map((state) => ({ value: state.isoCode, label: state.name, detail: state.isoCode }))}
                      onSearch={setStateSearch}
                      onOpenChange={setStateOpen}
                      onSelect={(value) => {
                        setForm((current) => ({ ...current, state: value }));
                        setStateOpen(false);
                        setStateSearch("");
                      }}
                    />
                  </Field>
                  <Field label="Password" htmlFor="password" icon={<Lock className="w-4 h-4" />}>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min. 6 characters" required autoComplete="new-password" className="pr-10" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm Password" htmlFor="confirmPassword" icon={<Lock className="w-4 h-4" />}>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Retype password" required autoComplete="new-password" className="pr-10" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  {err && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm p-3" role="alert">
                      {err}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex-col gap-4 pt-6">
                  <div className="flex w-full items-start gap-3 text-sm leading-5 text-muted-foreground">
                    <Checkbox
                      id="terms"
                      aria-label="Agree to the Terms of Service and Privacy Policy"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      disabled={loading}
                      className="mt-0.5"
                    />
                    <span>
                      I agree to the{" "}
                      <button type="button" onClick={() => setPolicy("terms")} className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button type="button" onClick={() => setPolicy("privacy")} className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </div>
                  <Button type="submit" className="boty-transition mt-2 h-10 w-full rounded-full shadow-lg shadow-primary/25" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? "Creating account…" : "Create Account"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/customer/login"
                      className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
        </div>
      </main>
      <Footer />
      <PolicyModal type={policy} onClose={() => setPolicy(null)} />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  icon,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="relative [&_input]:h-10 [&_input]:pl-10 [&_input]:rounded-lg sm:[&_input]:h-9">
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type CountryOption = { name: string; isoCode: string; phonecode: string };
type PickerOption = { value: string; label: string; detail?: string };

function CodePicker({
  value,
  leadingIcon,
  search,
  open,
  options,
  onSearch,
  onOpenChange,
  onSelect,
}: {
  value: string;
  leadingIcon?: React.ReactNode;
  search: string;
  open: boolean;
  options: CountryOption[];
  onSearch: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (country: CountryOption) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-10 w-22 justify-between rounded-lg px-3 sm:h-9">
          {leadingIcon}
          +{value.replace(/^\+/, "")}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" side="bottom" sideOffset={6} align="start" avoidCollisions={false}>
        <Command>
          <CommandInput value={search} onValueChange={onSearch} placeholder="Search country code..." />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>No country code found.</CommandEmpty>
            {options.map((country) => (
              <CommandItem key={country.isoCode} value={`${country.name} ${country.phonecode}`} onSelect={() => onSelect(country)}>
                <Check className={cn("h-4 w-4", value === `+${country.phonecode}` ? "opacity-100" : "opacity-0")} />
                <span className="flex-1">{country.name}</span>
                <span className="text-muted-foreground">+{country.phonecode}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SearchPicker({
  value,
  placeholder,
  open,
  search,
  disabled,
  className,
  leadingIcon,
  options,
  onSearch,
  onOpenChange,
  onSelect,
}: {
  value: string;
  placeholder: string;
  open: boolean;
  search: string;
  disabled?: boolean;
  className?: string;
  leadingIcon?: React.ReactNode;
  options: PickerOption[];
  onSearch: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("h-10 w-full justify-between rounded-lg pl-3 pr-3 font-normal sm:h-9", className)}
        >
          {leadingIcon}
          <span className={cn("min-w-0 flex-1 truncate text-left", value.startsWith("Select ") && "text-muted-foreground")}>{value}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" side="bottom" sideOffset={6} align="start" avoidCollisions={false}>
        <Command>
          <CommandInput value={search} onValueChange={onSearch} placeholder={placeholder} />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>No matches found.</CommandEmpty>
            {options.map((option) => (
              <CommandItem key={option.value} value={`${option.label} ${option.detail ?? ""}`} onSelect={() => onSelect(option.value)}>
                <Check className={cn("h-4 w-4", value === option.label ? "opacity-100" : "opacity-0")} />
                <span>{option.label}</span>
                {option.detail ? <span className="ml-auto text-muted-foreground">{option.detail}</span> : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
