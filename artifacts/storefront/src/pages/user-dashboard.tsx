import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetStorefrontSummary,
  useListProducts,
  useListCategories,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Bell,
  ShoppingBag,
  LayoutGrid,
  Zap,
  Truck,
  Tag,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Design tokens (mirrors mobile) ────────────────────────────────
const PURPLE       = "#7C3AED";
const PURPLE_DARK  = "#5B21B6";
const PURPLE_MID   = "#8B5CF6";
const PURPLE_LIGHT = "#EDE9FE";
const BG           = "#F8F7FF";
const RED_SALE     = "#EF4444";
const ORANGE       = "#F97316";
const TEXT_DARK    = "#1C1028";
const TEXT_MUTED   = "#6B7280";
const WHITE        = "#FFFFFF";
const CARD_BORDER  = "#F0EEFF";
const CAT_COLORS   = [PURPLE, "#EC4899", ORANGE, "#10B981", "#3B82F6", "#F59E0B", "#6366F1", "#14B8A6"];

// ── Countdown timer ───────────────────────────────────────────────
function CountdownTimer() {
  const [end] = useState(() => Date.now() + 2 * 60 * 60 * 1000);
  const [rem, setRem] = useState(end - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRem(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(id);
  }, [end]);
  const h = Math.floor(rem / 3_600_000);
  const m = Math.floor((rem % 3_600_000) / 60_000);
  const s = Math.floor((rem % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 mr-1">Ends in</span>
      {[pad(h), pad(m), pad(s)].map((u, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="text-xs font-bold text-white rounded px-1.5 py-0.5 tabular-nums"
            style={{ backgroundColor: PURPLE, minWidth: 26, display: "inline-block", textAlign: "center" }}
          >
            {u}
          </span>
          {i < 2 && <span className="font-bold" style={{ color: PURPLE }}>:</span>}
        </span>
      ))}
    </div>
  );
}

// ── Flash sale card ───────────────────────────────────────────────
function FlashCard({ product }: { product: Product }) {
  const orig = (product as any).originalPrice ?? (product as any).compareAtPrice;
  const pct  = orig && orig > product.price ? Math.round((1 - product.price / orig) * 100) : null;
  const fmt  = (v: number) =>
    product.currency === "NGN" ? `₦${v.toLocaleString()}` : `${product.currency} ${v.toLocaleString()}`;
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + product.id;
  return (
    <Link href={`/products/${slug}`}>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all flex-shrink-0 group"
        style={{ width: 164, backgroundColor: WHITE, border: `1px solid ${CARD_BORDER}` }}
      >
        <div className="relative" style={{ height: 164 }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {pct && (
            <span
              className="absolute top-2 left-2 text-[11px] font-bold text-white rounded-md px-2 py-0.5"
              style={{ backgroundColor: RED_SALE }}
            >
              -{pct}%
            </span>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight">{product.name}</p>
          <p className="text-sm font-bold" style={{ color: PURPLE }}>{fmt(product.price)}</p>
          {orig && <p className="text-xs text-gray-400 line-through">{fmt(orig)}</p>}
        </div>
      </div>
    </Link>
  );
}

// ── Section header ────────────────────────────────────────────────
function SectionHeader({ title, href, titleStyle }: { title: string; href?: string; titleStyle?: React.CSSProperties }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold" style={{ color: TEXT_DARK, ...titleStyle }}>{title}</h2>
      {href && (
        <Link href={href}>
          <span className="text-sm font-semibold flex items-center gap-1" style={{ color: PURPLE }}>
            See all <ArrowRight size={13} />
          </span>
        </Link>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────
export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const [catsExpanded, setCatsExpanded] = useState(false);

  const { data: meData } = useGetCurrentUser();
  const user = meData?.user ?? null;

  const { data: summary } = useGetStorefrontSummary();
  const { data: categories } = useListCategories();
  const { data: allProducts, isLoading } = useListProducts();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user ? (user as any).name?.split(" ")[0] ?? "there" : "there";

  // Group products by category
  const categoryGroups = (() => {
    if (!allProducts || !categories) return [];
    const map = new Map<string, Product[]>();
    for (const p of allProducts) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return categories
      .filter((c) => (map.get(c.slug)?.length ?? 0) > 0)
      .map((c) => ({ slug: c.slug, name: c.name, products: map.get(c.slug) ?? [] }));
  })();

  const VISIBLE_CATS = 3;
  const visibleGroups = catsExpanded ? categoryGroups : categoryGroups.slice(0, VISIBLE_CATS);
  const hasMore = categoryGroups.length > VISIBLE_CATS;

  const topCategories = summary?.topCategories ?? [];
  const trending      = summary?.trendingSearches ?? [];

  // Flash sale = products with originalPrice discount; fallback to all products
  const flashProducts = (allProducts ?? []).filter(
    (p) => (p as any).originalPrice && (p as any).originalPrice > p.price
  );
  const showFlash = flashProducts.length > 0 ? flashProducts.slice(0, 10) : (allProducts ?? []).slice(0, 8);

  const QUICK_ACTIONS = [
    { icon: <LayoutGrid size={22} color={PURPLE} />, label: "Categories", href: "/products" },
    { icon: <Zap size={22} color={PURPLE} />, label: "Flash Sale", href: "/products" },
    { icon: <Truck size={22} color={PURPLE} />, label: "Free Shipping", href: "/products" },
    { icon: <Tag size={22} color={PURPLE} />, label: "Vouchers", href: "/products" },
    { icon: <Sparkles size={22} color={PURPLE} />, label: "Ask AI", href: "/assistant" },
  ];

  return (
    <div style={{ backgroundColor: BG, minHeight: "100%" }}>

      {/* ── Purple header ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${PURPLE_DARK} 0%, ${PURPLE} 60%, ${PURPLE_MID} 100%)`,
          paddingBottom: 48,
        }}
        className="px-6 pt-8"
      >
        <div className="max-w-screen-xl mx-auto">
          {/* Greeting row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                {greeting()}, {firstName} 👋
              </p>
              <h1 className="text-2xl font-bold text-white mt-0.5">Find your perfect product</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/notifications">
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Bell size={18} color={WHITE} />
                </button>
              </Link>
              <Link href="/cart">
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <ShoppingBag size={18} color={WHITE} />
                </button>
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <button
            onClick={() => setLocation("/assistant")}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all hover:brightness-105"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              maxWidth: 800,
            }}
          >
            <Search size={18} color="rgba(255,255,255,0.7)" />
            <span className="flex-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Search for products…
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Sparkles size={14} color={WHITE} />
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6">

        {/* ── Hero banner + Quick actions card ── */}
        <div
          className="rounded-3xl bg-white -mt-8 mb-8 overflow-hidden"
          style={{ boxShadow: `0 8px 40px rgba(124,58,237,0.10)`, border: `1px solid ${CARD_BORDER}` }}
        >
          {/* Mega Sale banner */}
          <div
            className="flex items-center justify-between p-6"
            style={{ background: `linear-gradient(135deg, #4C1D95 0%, ${PURPLE} 100%)` }}
          >
            <div className="space-y-2">
              <span
                className="inline-block text-xs font-semibold rounded-full px-3 py-1"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: WHITE }}
              >
                🔥 Limited Time
              </span>
              <h2 className="text-3xl font-bold text-white">Mega Sale</h2>
              <p className="text-base" style={{ color: "rgba(255,255,255,0.85)" }}>Up to 60% Off</p>
              <button
                onClick={() => setLocation("/products")}
                className="flex items-center gap-2 rounded-full px-5 py-2 font-bold text-sm transition-opacity hover:opacity-90 mt-2"
                style={{ backgroundColor: WHITE, color: PURPLE }}
              >
                Shop Now <ArrowRight size={14} />
              </button>
            </div>
            <div className="text-7xl relative ml-6 select-none">
              🛍️
              <span
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center"
                style={{ backgroundColor: ORANGE }}
              >
                %
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-5 gap-1 p-5">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} href={a.href}>
                <div className="flex flex-col items-center gap-2 cursor-pointer group py-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: PURPLE_LIGHT }}
                  >
                    {a.icon}
                  </div>
                  <span className="text-xs font-medium text-center" style={{ color: TEXT_DARK }}>
                    {a.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Popular Categories ── */}
        {topCategories.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="Popular Categories" href="/products" />
            <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {topCategories.map((cat, i) => (
                <Link key={cat.slug} href={`/products?category=${cat.slug}`}>
                  <div className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                        boxShadow: `0 4px 14px ${CAT_COLORS[i % CAT_COLORS.length]}55`,
                      }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: TEXT_DARK }}>
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Flash Sale ── */}
        {showFlash.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold flex items-center gap-1.5" style={{ color: RED_SALE }}>
                  ⚡ Flash Sale
                </h2>
                <CountdownTimer />
              </div>
              <Link href="/products">
                <span className="text-sm font-semibold flex items-center gap-1" style={{ color: PURPLE }}>
                  See all <ArrowRight size={13} />
                </span>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
              {showFlash.map((p) => <FlashCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── Category product rows ── */}
        {isLoading ? (
          <div className="space-y-10 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48 rounded" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="aspect-square rounded-xl" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : categoryGroups.length === 0 ? (
          <div className="text-center py-20" style={{ color: TEXT_MUTED }}>
            <p className="text-lg font-medium">No products yet.</p>
            <p className="text-sm mt-1">Add products via the admin panel.</p>
          </div>
        ) : (
          <div className="space-y-10 mb-12">
            {visibleGroups.map((group) => (
              <section key={group.slug}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold capitalize" style={{ color: TEXT_DARK }}>{group.name}</h2>
                  <Link href={`/products?category=${group.slug}`}>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: PURPLE }}>
                      See all <ArrowRight size={13} />
                    </span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {group.products.slice(0, 5).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setCatsExpanded((e) => !e)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors"
                  style={{ border: `2px solid ${PURPLE}`, color: PURPLE, backgroundColor: WHITE }}
                >
                  {catsExpanded ? (
                    <><ChevronUp size={16} /> Show less</>
                  ) : (
                    <><ChevronDown size={16} /> Show {categoryGroups.length - VISIBLE_CATS} more categories</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Trending ── */}
        {trending.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4" style={{ color: TEXT_DARK }}>🔥 Trending</h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((term) => (
                <button
                  key={term}
                  onClick={() => setLocation(`/products?q=${encodeURIComponent(term)}`)}
                  className="text-sm font-medium px-4 py-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: PURPLE_LIGHT, color: PURPLE }}
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
