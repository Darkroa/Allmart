import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Sparkles, ArrowRight, ShoppingBag,
  Zap, Truck, Shield, LayoutGrid, Menu,
  Watch, Mountain, Footprints, Heart, Laptop,
  Shirt, Dumbbell, BookOpen, Gamepad2, Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";

const QUICK_ACTIONS = [
  { icon: LayoutGrid, label: "Categories", href: "/account" },
  { icon: Zap,        label: "Flash Sale",  href: "/account" },
  { icon: Truck,      label: "Free Ship",   href: "/account" },
  { icon: Shield,     label: "Vouchers",    href: "/account" },
];

const CAT_COLORS = [
  "#EC4899","#F97316","#10B981","#3B82F6",
  "#8B5CF6","#06B6D4","#EF4444","#F59E0B","#14B8A6",
];
const CATEGORIES = [
  { label: "Electronics", Icon: Laptop },
  { label: "Accessories", Icon: Watch },
  { label: "Outdoor",     Icon: Mountain },
  { label: "Shoes",       Icon: Footprints },
  { label: "Beauty",      Icon: Heart },
  { label: "Home",        Icon: HomeIcon },
  { label: "Clothing",    Icon: Shirt },
  { label: "Sports",      Icon: Dumbbell },
  { label: "Books",       Icon: BookOpen },
  { label: "Gaming",      Icon: Gamepad2 },
];

const SHOP_LINKS = [
  { href: "/account", label: "All Products" },
  { href: "/account", label: "Flash Sale" },
  { href: "/account", label: "New Arrivals" },
  { href: "/account", label: "Ask AI" },
];

function NavDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors shrink-0">
          <Menu className="h-4 w-4 text-white" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <div className="bg-primary px-6 py-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">AllMart</p>
            <p className="text-xs text-white/70">Sign in to shop</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SHOP_LINKS.map((item) => (
            <SheetClose asChild key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </span>
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="border-t border-border/50 px-4 py-4 space-y-2">
          <SheetClose asChild>
            <Link href="/account">
              <Button className="w-full rounded-xl gap-2">
                <Sparkles className="h-4 w-4" /> Sign in to shop
              </Button>
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Landing() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      sessionStorage.setItem("initial_assistant_query", query);
    }
    setLocation("/account");
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0D0B1A]">

      {/* ── Purple header card — same style as the store ─────────────────────── */}
      <section className="bg-primary px-4 pb-5 pt-safe rounded-b-[28px] shadow-xl shadow-primary/30">

        {/* Top bar */}
        <div className="flex items-center gap-3 pt-3 pb-3">
          <NavDrawer />

          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/70 font-medium leading-none mb-0.5">
              {greeting()} 👋
            </p>
            <p className="text-sm font-bold text-white leading-tight">
              Find your perfect product
            </p>
          </div>

          <Link href="/account">
            <button className="flex h-8 items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-3 text-[11px] font-semibold text-white transition-colors">
              Sign in
            </button>
          </Link>
        </div>

        {/* AI Search bar */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center bg-white/15 focus-within:bg-white/22 rounded-2xl px-4 py-2.5 gap-3 border border-white/20 transition-colors">
            <Search className="h-4 w-4 text-white/50 shrink-0" />
            <input
              type="text"
              placeholder="Search for products..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 flex h-6 items-center gap-1 rounded-full bg-white/20 px-2.5 text-[11px] font-semibold text-white hover:bg-white/30 transition-colors"
            >
              <Sparkles className="h-3 w-3" /> Ask AI
            </button>
          </div>
        </form>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto w-full px-4 space-y-6 py-5 pb-24">

        {/* Promo banner */}
        <Link href="/account">
          <div className="relative overflow-hidden rounded-2xl bg-[#1e1150] px-6 py-5 flex items-center justify-between shadow-xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                🔥 Limited Time
              </span>
              <p className="text-2xl font-extrabold text-white">Mega Sale</p>
              <p className="text-sm text-white/70">Up to 60% Off</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-primary">
                Shop Now <ArrowRight className="h-3 w-3" />
              </div>
            </div>
            <div className="relative z-10 text-5xl select-none">🛍️</div>
          </div>
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href}>
              <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/20 group-hover:bg-primary/30 transition-colors shadow">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-white/60 text-center leading-tight">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Popular categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Popular Categories</h2>
            <Link href="/account">
              <span className="text-xs font-semibold text-primary hover:underline">See all</span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(({ label, Icon }, i) => (
              <Link key={label} href="/account">
                <div className="flex flex-col items-center gap-1.5 w-14 shrink-0 cursor-pointer">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl shadow"
                    style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-white/60 text-center leading-tight truncate w-full">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sign-in prompt */}
        <div className="rounded-2xl bg-primary/10 border border-primary/20 px-5 py-5 flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">AI-Powered Shopping</p>
            <p className="text-xs text-white/50 mt-0.5">Sign in to shop, track orders, and chat with our AI assistant</p>
          </div>
          <Link href="/account" className="w-full">
            <Button className="w-full rounded-xl gap-2 bg-primary hover:bg-primary/90">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
