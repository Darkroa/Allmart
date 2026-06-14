import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, X, AlertTriangle } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";

type BankDetails = { bankName: string; accountName: string; accountNumber: string; routingNumber?: string; bankLogo?: string; email?: string };

export function BankDetailsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [form, setForm] = useState<BankDetails>({ bankName: "", accountName: "", accountNumber: "", routingNumber: "", bankLogo: "" });
  const [cautionNote, setCautionNote] = useState("");
  const { upload, isUploading } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/bank").then(r => r.json()),
      fetch("/api/settings/bank-caution").then(r => r.json()),
    ])
      .then(([bank, caution]) => {
        setForm(bank as BankDetails);
        setCautionNote((caution as { note: string }).note ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(field: keyof BankDetails, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const { servingUrl } = await upload(file);
      setForm(prev => ({ ...prev, bankLogo: servingUrl }));
      toast({ title: "Logo uploaded!" });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/bank", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ title: "Error", description: err.error ?? "Failed to save", variant: "destructive" });
        return;
      }
      toast({ title: "Saved", description: "Bank details updated successfully." });
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCaution() {
    setSavingNote(true);
    try {
      const res = await fetch("/api/settings/bank-caution", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: cautionNote }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ title: "Error", description: err.error ?? "Failed to save", variant: "destructive" });
        return;
      }
      toast({ title: "Saved", description: "Caution note updated." });
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/50 shadow-sm space-y-5">
        <div>
          <h3 className="font-semibold text-base mb-1">Bank transfer details</h3>
          <p className="text-sm text-muted-foreground">
            These details are shown to customers who choose manual bank transfer at checkout.
          </p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>Bank logo <span className="text-muted-foreground font-normal">(optional, shown as round icon)</span></Label>
          <div className="flex items-center gap-4">
            {form.bankLogo ? (
              <div className="relative">
                <img src={form.bankLogo} alt="Bank logo" className="h-16 w-16 rounded-full object-cover border-2 border-border/60 shadow-sm" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, bankLogo: "" }))}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? "Uploading…" : form.bankLogo ? "Change logo" : "Upload logo"}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Bank name</Label>
            <Input id="bankName" placeholder="e.g. First Bank" value={form.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountName">Account name</Label>
            <Input id="accountName" placeholder="e.g. AllMart Marketplace Ltd" value={form.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber">Account number</Label>
            <Input id="accountNumber" placeholder="e.g. 0123456789" value={form.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="routingNumber">Routing number <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="routingNumber" placeholder="e.g. 021000021" value={form.routingNumber ?? ""}
              onChange={(e) => handleChange("routingNumber", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankEmail">Contact email <span className="text-muted-foreground font-normal">(optional, shown to customers)</span></Label>
            <Input id="bankEmail" type="email" placeholder="e.g. payments@allmart.com" value={form.email ?? ""}
              onChange={(e) => handleChange("email", e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save details"}
        </Button>
      </Card>

      {/* Caution note editor */}
      <Card className="p-6 border-border/50 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-0.5">Payment caution note</h3>
            <p className="text-sm text-muted-foreground">
              This message is shown inside the yellow warning box on the bank transfer payment page. Customers see it when they choose bank transfer at checkout.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cautionNote">Caution message</Label>
          <Textarea
            id="cautionNote"
            value={cautionNote}
            onChange={e => setCautionNote(e.target.value)}
            placeholder="e.g. Always include your reference number in the transfer description…"
            className="h-28 resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">Tip: mention the reference number requirement and screenshot upload to reduce payment delays.</p>
        </div>

        <Button onClick={handleSaveCaution} disabled={savingNote} variant="outline" className="gap-2">
          {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {savingNote ? "Saving…" : "Save caution note"}
        </Button>
      </Card>
    </div>
  );
}
