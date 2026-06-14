import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Users, Settings2, CheckCircle2 } from "lucide-react";

type ReferralRecord = {
  id: number;
  referrer: { id: number; name: string; email: string };
  referred: { id: number; name: string; email: string };
  referrerBonus: number;
  referredBonus: number;
  referrerClaimed: boolean;
  createdAt: string;
};

type ReferralSettings = {
  referralReferrerBonus: number;
  referralSignupBonus: number;
  referralNote: string;
};

function useFetch<T>(url: string) {
  return useQuery<T>({
    queryKey: [url],
    queryFn: () => fetch(url, { credentials: "include" }).then(r => r.json()),
  });
}

export function AdminReferrals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: records = [], isLoading: loadingRecords } = useFetch<ReferralRecord[]>("/api/admin/referrals");
  const { data: settings, isLoading: loadingSettings } = useFetch<ReferralSettings>("/api/admin/referral-settings");

  const [referrerBonus, setReferrerBonus] = useState("");
  const [signupBonus, setSignupBonus] = useState("");
  const [note, setNote] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  if (settings && !settingsLoaded) {
    setReferrerBonus(String(settings.referralReferrerBonus));
    setSignupBonus(String(settings.referralSignupBonus));
    setNote(settings.referralNote);
    setSettingsLoaded(true);
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/referral-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralReferrerBonus: Number(referrerBonus),
          referralSignupBonus: Number(signupBonus),
          referralNote: note,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/referral-settings"] });
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  }

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Settings card */}
      <Card className="p-6 border-border/50 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Referral settings</h3>
        </div>

        {loadingSettings ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ref-referrer">Referrer bonus ($)</Label>
                <Input id="ref-referrer" type="number" min="0" step="0.01" value={referrerBonus}
                  onChange={e => setReferrerBonus(e.target.value)} placeholder="10" />
                <p className="text-xs text-muted-foreground">Earned by the person who shared the link (claimable)</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ref-signup">Sign-up bonus ($)</Label>
                <Input id="ref-signup" type="number" min="0" step="0.01" value={signupBonus}
                  onChange={e => setSignupBonus(e.target.value)} placeholder="20" />
                <p className="text-xs text-muted-foreground">Given to new users who used a referral link</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref-note">Referral note <span className="text-muted-foreground font-normal">(shown to users)</span></Label>
              <Textarea id="ref-note" value={note} onChange={e => setNote(e.target.value)}
                className="h-20 resize-none"
                placeholder="Refer friends and earn bonus credits you can use on your next order!" />
            </div>
            <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
              {savingSettings ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save settings</>}
            </Button>
          </>
        )}
      </Card>

      {/* Referrals table */}
      <Card className="p-6 border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">All referrals</h3>
          <span className="text-xs text-muted-foreground ml-auto">{records.length} total</span>
        </div>

        {loadingRecords ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No referrals yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left pb-2 font-medium text-muted-foreground">Referrer</th>
                  <th className="text-left pb-2 font-medium text-muted-foreground">Referred</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Referrer bonus</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Signup bonus</th>
                  <th className="text-center pb-2 font-medium text-muted-foreground">Claimed</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{r.referrer.name}</div>
                      <div className="text-muted-foreground">{r.referrer.email}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{r.referred.name}</div>
                      <div className="text-muted-foreground">{r.referred.email}</div>
                    </td>
                    <td className="py-2 pr-3 text-right text-violet-600 font-medium">{fmt(r.referrerBonus)}</td>
                    <td className="py-2 pr-3 text-right text-emerald-600 font-medium">{fmt(r.referredBonus)}</td>
                    <td className="py-2 text-center">
                      {r.referrerClaimed
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        : <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">Pending</span>}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
