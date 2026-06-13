import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, DollarSign, Calendar, BarChart2 } from "lucide-react";
import { AdminLiveVisitors } from "@/components/admin-live-visitors";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
} from "recharts";

type SalesSummary = {
  todayTotal: number;
  monthTotal: number;
  allTimeTotal: number;
  todayOrders: number;
  monthOrders: number;
  allTimeOrders: number;
  dailyChart: { date: string; total: number; orders: number }[];
};

function fmtFull(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`;
  return fmtFull(n);
}

function shortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
};

function StatCard({ label, value, sub, icon, iconBg }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight leading-none truncate">{value}</p>
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sales-summary", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d as SalesSummary); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = data?.dailyChart.map((d) => ({
    ...d,
    label: shortDate(d.date),
  })) ?? [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-40 mb-5" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl bg-muted/40 p-4 space-y-3">
                <div className="h-10 w-10 bg-muted rounded-xl" />
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-7 bg-muted rounded w-28" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminLiveVisitors />

      {/* Sales Overview */}
      <Card className="p-6 border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Sales Overview</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today"
            value={fmtCompact(data?.todayTotal ?? 0)}
            sub={`${data?.todayOrders ?? 0} order${data?.todayOrders === 1 ? "" : "s"}`}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          />
          <StatCard
            label="This Month"
            value={fmtCompact(data?.monthTotal ?? 0)}
            sub={`${data?.monthOrders ?? 0} order${data?.monthOrders === 1 ? "" : "s"}`}
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            label="All-Time Revenue"
            value={fmtCompact(data?.allTimeTotal ?? 0)}
            sub={`${data?.allTimeOrders ?? 0} total orders`}
            iconBg="bg-primary/10"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <StatCard
            label="Total Orders"
            value={String(data?.allTimeOrders ?? 0)}
            sub="across all time"
            iconBg="bg-violet-50 dark:bg-violet-950/40"
            icon={<ShoppingBag className="h-5 w-5 text-violet-600" />}
          />
        </div>
      </Card>

      {/* 30-day Revenue Chart */}
      <Card className="p-6 border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Last 30 days — daily revenue</h3>
        </div>

        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v === 0 ? "$0" : fmtCompact(v)}
                width={56}
              />
              <Tooltip
                formatter={(v: number) => [fmtFull(v), "Revenue"]}
                labelFormatter={(l) => `Date: ${l}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: "hsl(var(--primary))", fill: "hsl(var(--card))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
