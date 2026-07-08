import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import {
  Search, Sparkles, ArrowRight, ShoppingBag,
  Zap, Truck, Shield, LayoutGrid, Menu,
  ChevronLeft, ChevronRight, Tag, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";

// ── Nav drawer ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "All Products", icon: LayoutGrid },
  { label: "Flash Sale",   icon: Zap },
  { label: "New Arrivals", icon: Tag },
  { label: "Ask AI",       icon: Sparkles },
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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ label, icon: Icon }) => (
            <SheetClose asChild key={label}>
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
                {label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="border-t border-border/50 px-4 py-4">
          <SheetClose asChild>
            <Link href="/account">
              <Button className="w-full rounded-xl gap-2">
                Sign in to shop <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Product carousel ──────────────────────────────────────────────────────────
function ProductSlider({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = products.length;

  const go = (idx: number) => setCurrent((idx + total) % total);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % total), 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total]);

  const formatPrice = (p: Product) =>
    `${p.currency === "NGN" ? "₦" : p.currency}${p.price.toLocaleString()}`;

  const orig = (p: Product): number | null => {
    const o = (p as any).originalPrice ?? (p as any).compareAtPrice;
    return o && o > p.price ? o : null;
  };

  const discount = (p: Product) => {
    const o = orig(p);
    return o ? Math.round(100 - (p.price / o) * 100) : null;
  };

  return (
    <div className="space-y-3">
      {/* Slide */}
      <Link href="/account">
        <div className="relative w-full overflow-hidden rounded-2xl bg-white/5 cursor-pointer group">
          {/* Square image */}
          <div className="relative w-full" style={{ paddingBottom: "100%" }}>
            {products[current].imageUrl ? (
              <img
                key={products[current].id}
                src={products[current].imageUrl!}
                alt={products[current].name}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <ShoppingBag className="h-16 w-16 text-primary/30" />
              </div>
            )}

            {/* Discount badge */}
            {discount(products[current]) && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-lg">
                -{discount(products[current])}%
              </div>
            )}

            {/* Nav arrows */}
            <button
              onClick={e => { e.preventDefault(); go(current - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={e => { e.preventDefault(); go(current + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {products.slice(0, Math.min(total, 8)).map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); go(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === current % 8 ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </div>

          {/* Info below image */}
          <div className="p-3 space-y-1">
            <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">
              {products[current].name}
            </p>
            {products[current].description && (
              <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                {products[current].description}
              </p>
            )}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-primary">
                  {formatPrice(products[current])}
                </span>
                {orig(products[current]) && (
                  <span className="text-xs text-white/40 line-through">
                    {`${products[current].currency === "NGN" ? "₦" : products[current].currency}${orig(products[current])!.toLocaleString()}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs text-white/60 font-medium">
                  {((products[current] as any).rating ?? 4.5).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Grid of product cards below slider ───────────────────────────────────────
function ProductGrid({ products }: { products: Product[] }) {
  const formatPrice = (p: Product) =>
    `${p.currency === "NGN" ? "₦" : p.currency}${p.price.toLocaleString()}`;

  const orig = (p: Product): number | null => {
    const o = (p as any).originalPrice ?? (p as any).compareAtPrice;
    return o && o > p.price ? o : null;
  };

  const discount = (p: Product) => {
    const o = orig(p);
    return o ? Math.round(100 - (p.price / o) * 100) : null;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map(p => (
        <Link key={p.id} href="/account">
          <div className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden cursor-pointer hover:bg-white/8 transition-colors">
            {/* Square image */}
            <div className="relative w-full" style={{ paddingBottom: "100%" }}>
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                  <ShoppingBag className="h-8 w-8 text-primary/30" />
                </div>
              )}
              {discount(p) && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  -{discount(p)}%
                </div>
              )}
            </div>
            <div className="p-2.5 space-y-0.5">
              <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">{p.name}</p>
              <p className="text-sm font-bold text-primary">{formatPrice(p)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: LayoutGrid, label: "Categories" },
  { icon: Zap,        label: "Flash Sale" },
  { icon: Truck,      label: "Free Ship"  },
  { icon: Shield,     label: "Vouchers"   },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Landing() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useListProducts();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) sessionStorage.setItem("initial_assistant_query", query);
    setLocation("/account");
  };

  const featured = (products ?? []).filter(p => p.imageUrl).slice(0, 8);
  const grid = (products ?? []).filter(p => p.imageUrl).slice(8, 16);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0D0B1A]">

      {/* ── Purple header ──────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 pb-5 pt-safe rounded-b-[28px] shadow-xl shadow-primary/30">
        <div className="flex items-center gap-3 pt-3 pb-3">
          <NavDrawer />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/70 font-medium leading-none mb-0.5">
              {greeting()} 👋
            </p>
            <p className="text-sm font-bold text-white leading-tight truncate">
              Find your perfect product
            </p>
          </div>
          <Link href="/account">
            <button className="flex h-8 items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-3 text-[11px] font-semibold text-white transition-colors">
              Sign in
            </button>
          </Link>
        </div>

        {/* AI search */}
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

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-screen-sm mx-auto w-full px-4 space-y-5 py-5 pb-10">

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
            <Link key={label} href="/account">
              <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/20 group-hover:bg-primary/30 transition-colors shadow">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-white/60 text-center">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured slider — Instagram square */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-white">Featured</h2>
            <Link href="/account">
              <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          {isLoading ? (
            <div className="w-full rounded-2xl bg-white/5 animate-pulse" style={{ paddingBottom: "100%" }} />
          ) : featured.length > 0 ? (
            <ProductSlider products={featured} />
          ) : (
            <Link href="/account">
              <div className="w-full rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/15 transition-colors" style={{ paddingBottom: "100%", position: "relative" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <ShoppingBag className="h-12 w-12 text-primary/40" />
                  <p className="text-sm font-semibold text-white/60 text-center">Sign in to see products</p>
                  <Button size="sm" className="rounded-xl gap-2">
                    Get started <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Product grid */}
        {grid.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white">More Products</h2>
              <Link href="/account">
                <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                  See all <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <ProductGrid products={grid} />
          </div>
        )}

        {/* Sign-in CTA */}
        <Link href="/account">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-primary/15 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 shrink-0">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Start shopping</p>
                <p className="text-xs text-white/50">Sign in for full access</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
