import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function Security() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: meData } = useGetCurrentUser();
  const me = meData?.user ?? null;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!me) { setLocation("/account"); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      toast({ title: "New password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Password updated!", description: "Your password has been changed successfully." });
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-12 px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold">Security</h1>
          <p className="text-sm text-muted-foreground">Change your account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 border-border/50 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="sec-current">Current password</Label>
            <div className="relative">
              <Input
                id="sec-current"
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={e => setCurrent(e.target.value)}
                placeholder="Your current password"
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(v => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec-new">New password</Label>
            <div className="relative">
              <Input
                id="sec-new"
                type={showNext ? "text" : "password"}
                value={next}
                onChange={e => setNext(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNext(v => !v)}
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {next && next.length < 6 && (
              <p className="text-xs text-destructive">Must be at least 6 characters</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec-confirm">Confirm new password</Label>
            <Input
              id="sec-confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
            />
            {confirm && next !== confirm && (
              <p className="text-xs text-destructive">Passwords don't match</p>
            )}
          </div>

          {done && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Password changed successfully.
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={saving || !current || !next || !confirm}
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
