import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Radio, MapPin, Clock, Monitor } from "lucide-react";

type LiveSession = {
  sessionId: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  currentPage: string;
  firstSeen: string;
  lastSeen: string;
  timeSpentMs: number;
  pagesVisited: string[];
};

type LiveData = {
  count: number;
  sessions: LiveSession[];
};

function countryFlag(raw: string | null): { flag: string; name: string; city: string } {
  if (!raw) return { flag: "🌐", name: "Unknown", city: "" };
  const [code, ...nameParts] = raw.split("|");
  const name = nameParts.join("|") || code || "Unknown";
  const flag = (code ?? "").length === 2
    ? (code ?? "").toUpperCase().replace(/./g, (c) =>
        String.fromCodePoint((c.codePointAt(0) ?? 65) + 127397)
      )
    : "🌐";
  return { flag, name, city: "" };
}

function formatDuration(ms: number): string {
  if (ms < 5000) return "just arrived";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
  return `${Math.round(ms / 3600_000)}h ${Math.round((ms % 3600_000) / 60_000)}m`;
}

function pageLabel(page: string): string {
  if (page === "/" || page === "") return "Home";
  const parts = page.split("/").filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" › ");
}

function pageColor(page: string): string {
  if (page === "/") return "bg-primary/10 text-primary";
  if (page.startsWith("/products")) return "bg-violet-100 text-violet-700";
  if (page.startsWith("/orders")) return "bg-blue-100 text-blue-700";
  if (page.startsWith("/cart")) return "bg-amber-100 text-amber-700";
  if (page.startsWith("/assistant")) return "bg-emerald-100 text-emerald-700";
  if (page.startsWith("/payment")) return "bg-rose-100 text-rose-700";
  return "bg-muted text-muted-foreground";
}

export function AdminLiveVisitors() {
  const [data, setData] = useState<LiveData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/visitors/live", { credentials: "include" });
      if (res.ok) {
        setData(await res.json() as LiveData);
        setLastUpdated(new Date());
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const count = data?.count ?? 0;
  const sessions = data?.sessions ?? [];

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${count > 0 ? "bg-emerald-400" : "bg-muted-foreground"}`} />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${count > 0 ? "bg-emerald-500" : "bg-muted-foreground"}`} />
          </div>
          <div>
            <p className="font-semibold text-sm">Live visitors</p>
            <p className="text-xs text-muted-foreground">active in the last 5 minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
            <Radio className="h-3.5 w-3.5" />
            {count} online
          </div>
        </div>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="py-10 text-center">
          <Monitor className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active visitors right now</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Refreshes every 30 seconds</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {sessions.map((s) => {
            const geo = countryFlag(s.country);
            const cityLabel = s.city ?? geo.city;
            return (
              <div key={s.sessionId} className="px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {/* Country flag + location */}
                <div className="flex items-center gap-2 w-36 shrink-0">
                  <span className="text-2xl leading-none" title={geo.name}>{geo.flag}</span>
                  <div>
                    <p className="text-xs font-medium leading-tight">{geo.name}</p>
                    {cityLabel && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />{cityLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Current page badge */}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${pageColor(s.currentPage)}`}>
                  {pageLabel(s.currentPage)}
                </span>

                {/* Pages visited trail */}
                {s.pagesVisited.length > 1 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    {s.pagesVisited.slice(-4).map((p, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        {i > 0 && <span>›</span>}
                        <span className="font-mono">{p === "/" ? "Home" : p.split("/")[1]}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Time spent */}
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(s.timeSpentMs)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
