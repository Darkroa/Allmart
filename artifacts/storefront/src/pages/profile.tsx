import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Save, CheckCircle2 } from "lucide-react";

const COUNTRIES = [
  { code: "NG", flag: "🇳🇬", name: "Nigeria", dial: "+234" },
  { code: "GH", flag: "🇬🇭", name: "Ghana", dial: "+233" },
  { code: "KE", flag: "🇰🇪", name: "Kenya", dial: "+254" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", dial: "+27" },
  { code: "EG", flag: "🇪🇬", name: "Egypt", dial: "+20" },
  { code: "ET", flag: "🇪🇹", name: "Ethiopia", dial: "+251" },
  { code: "TZ", flag: "🇹🇿", name: "Tanzania", dial: "+255" },
  { code: "UG", flag: "🇺🇬", name: "Uganda", dial: "+256" },
  { code: "SN", flag: "🇸🇳", name: "Senegal", dial: "+221" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire", dial: "+225" },
  { code: "CM", flag: "🇨🇲", name: "Cameroon", dial: "+237" },
  { code: "US", flag: "🇺🇸", name: "United States", dial: "+1" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", dial: "+44" },
  { code: "CA", flag: "🇨🇦", name: "Canada", dial: "+1" },
  { code: "AU", flag: "🇦🇺", name: "Australia", dial: "+61" },
  { code: "DE", flag: "🇩🇪", name: "Germany", dial: "+49" },
  { code: "FR", flag: "🇫🇷", name: "France", dial: "+33" },
  { code: "IN", flag: "🇮🇳", name: "India", dial: "+91" },
  { code: "BR", flag: "🇧🇷", name: "Brazil", dial: "+55" },
  { code: "MX", flag: "🇲🇽", name: "Mexico", dial: "+52" },
  { code: "AE", flag: "🇦🇪", name: "UAE", dial: "+971" },
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia", dial: "+966" },
  { code: "ZW", flag: "🇿🇼", name: "Zimbabwe", dial: "+263" },
  { code: "ZM", flag: "🇿🇲", name: "Zambia", dial: "+260" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda", dial: "+250" },
  { code: "OTHER", flag: "🌍", name: "Other", dial: "" },
];

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: meData, isLoading } = useGetCurrentUser();
  const me = meData?.user ?? null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setName((me as { name?: string }).name ?? "");
      setEmail((me as { email?: string }).email ?? "");
      setCountry((me as { country?: string | null }).country ?? "");
      setPhone((me as { phone?: string | null }).phone ?? "");
      setSex((me as { sex?: string | null }).sex ?? "");
      setAddress((me as { address?: string | null }).address ?? "");
    }
  }, [me]);

  function handleCountryChange(code: string) {
    setCountry(code);
    const c = COUNTRIES.find(c => c.code === code);
    if (c && c.dial && !phone.startsWith(c.dial)) {
      setPhone(c.dial + " ");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!email.trim()) { toast({ title: "Email is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          country: country || null,
          phone: phone.trim() || null,
          sex: sex || null,
          address: address.trim() || null,
          profileComplete: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ title: "Profile saved!", description: "Your information has been updated." });
      setSaved(true);
      setTimeout(() => {
        const role = (me as { role?: string })?.role;
        if (role === "admin") setLocation("/admin");
        else if (role === "pm") setLocation("/pm");
        else setLocation("/");
      }, 800);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!me) {
    setLocation("/account");
    return null;
  }

  const isComplete = !!(me as { profileComplete?: boolean }).profileComplete;

  return (
    <div className="container max-w-2xl mx-auto py-12 px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">Your profile</h1>
            {!isComplete && (
              <p className="text-sm text-amber-600 font-medium mt-0.5">
                Please complete your profile to continue shopping.
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 border-border/50 shadow-sm space-y-5">
          <h2 className="font-semibold text-base">Personal information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Full name *</Label>
              <Input id="p-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email *</Label>
              <Input id="p-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-country">Country</Label>
              <select
                id="p-country"
                value={country}
                onChange={e => handleCountryChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select country…</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Phone number</Label>
              <Input id="p-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 800 000 0000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-sex">Gender</Label>
            <select
              id="p-sex"
              value={sex}
              onChange={e => setSex(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select gender…</option>
              {SEX_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-address">Default delivery address</Label>
            <Textarea
              id="p-address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, city, state, postal code…"
              className="h-24 resize-none"
            />
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full h-12 text-base gap-2" disabled={saving || saved}>
          {saved
            ? <><CheckCircle2 className="h-5 w-5" /> Saved!</>
            : saving
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
              : <><Save className="h-5 w-5" /> Save profile</>}
        </Button>
      </form>
    </div>
  );
}
