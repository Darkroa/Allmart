import { useEffect, useState } from "react";
import { Eye, Users, RefreshCcw, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Import the Live Visitors component
import { AdminLiveVisitors } from "@/components/admin-live-visitors";

type VisitorRow = {
  id: number;
  sessionId: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  page: string;
  isReturning: boolean;
  createdAt: string;
};

type VisitorStats = {
  total: number;
  unique: number;
  returning: number;
  rows: VisitorRow[];
  byPage: { page: string; count: number }[];
};

export function AdminVisitors() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/visitors?days=${days}`, { credentials: "include" });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [days]);

  return (
    <div className="space-y-6">
      {/* Live Visitors from Dashboard - Added at the top */}
      <AdminLiveVisitors />

      {/* Time Filter & Refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        {[7, 14, 30].map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setDays(d)}
          >
            Last {d} days
          </Button>
        ))}
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 text-xs gap-1" 
          onClick={load} 
          disabled={loading}
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> 
          Refresh
        </Button>
      </div>

      {loading && !stats ? (
        <p className="text-sm text-muted-foreground">Loading visitor data…</p>
      ) : !stats ? (
        <p className="text-sm text-muted-foreground">No data available.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Total visits", value: stats.total, icon: Eye },
              { label: "Unique visitors", value: stats.unique, icon: Users },
              { label: "Returning", value: stats.returning, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {stats.byPage.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
              <h4 className="font-semibold text-sm mb-3">Top pages</h4>
              <div className="space-y-2">
                {stats.byPage.map(({ page, count }) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={page} className="flex items-center gap-3">
                      <code className="text-xs text-muted-foreground w-32 truncate shrink-0">{page}</code>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <h4 className="font-semibold text-sm">Recent visitors</h4>
            </div>
            {stats.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No visitors yet.</p>
            ) : (
              <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {stats.rows.map((v) => (
                  <div 
                    key={v.id} 
                    className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs"
                  >
                    <span className="font-mono text-muted-foreground w-24 truncate">{v.ip ?? "—"}</span>
                    <span className="font-medium">{v.page}</span>
                    {v.referrer && (
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" />{v.referrer.slice(0, 40)}
                      </span>
                    )}
                    {v.isReturning && (
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        Returning
                      </span>
                    )}
                    <span className="ml-auto text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}