import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function AdminTelegram() {
  const [registering, setRegistering] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; webhookUrl?: string; error?: string } | null>(null);

  async function registerWebhook() {
    setRegistering(true);
    setResult(null);
    try {
      const res = await fetch("/api/telegram/set-webhook", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setResult({ ok: true, webhookUrl: data.webhookUrl });
      else setResult({ ok: false, error: data.error ?? "Failed" });
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Telegram bot setup</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Register the webhook so Telegram delivers messages to this server. You only need to do this once (or after changing your domain).
        </p>
        <Button onClick={registerWebhook} disabled={registering} className="gap-2">
          {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {registering ? "Registering…" : "Register webhook"}
        </Button>
        {result && (
          <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <div>
              {result.ok ? (
                <>Webhook registered at <code className="font-mono text-xs">{result.webhookUrl}</code></>
              ) : (
                result.error
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm">Available bot commands</h3>
        <div className="space-y-2">
          {[
            { cmd: "/orders", desc: "Show the last 5 orders" },
            { cmd: "/pending", desc: "Orders awaiting payment screenshot verification" },
            { cmd: "/notifications", desc: "Last 5 admin notifications" },
            { cmd: "/help", desc: "Show this command list" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-center gap-3 text-sm">
              <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded w-36 shrink-0">{cmd}</code>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          The bot also pushes automatic alerts for new visitor arrivals, payment screenshots uploaded, and payment decisions (verified/rejected).
        </p>
      </div>
    </div>
  );
}
