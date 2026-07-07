import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useGetStorefrontSummary, useListProducts, useListCategories, useGetCurrentUser, useGetCart } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, Search, Sparkles, ChevronDown, ChevronUp,
  Store, Package, Bell, ShoppingBag, LogOut, Lock, Users, UserCog, LifeBuoy, UserCircle2, Menu,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import { StaffSidebarTrigger } from "@/components/staff-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, getGetCurrentUserQueryKey, getGetCartQueryKey, getListOrdersQueryKey, getListChatMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SHOP_NAV = [
  { href: "/products", icon: Store, label: "All Products" },
  { href: "/products?sort=featured", icon: Sparkles, label: "Featured" },
  { href: "/products?sort=new", icon: ArrowRight, label: "New Arrivals" },
  { href: "/products?sort=sale", icon: ChevronDown, label: "Sale" },
];

function ShopDrawerInner() {
  const [location] = useLocation();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="h-9 w-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
          <Menu className="h-5 w-5 text-white" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <div className="bg-primary px-6 py-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-white text-lg leading-tight">Shop</p>
            <p className="text-xs text-white/70">Browse AllMart</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SHOP_NAV.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href.split("?")[0]));
            const ItemIcon = item.icon;
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                    active ? "bg-primary/10 text-primary font-semibold" : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-primary/15" : "bg-muted"}`}>
                    <ItemIcon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </span>
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        <div className="border-t border-border/50 px-4 py-3">
          <SheetClose asChild>
            <Link href="/products">
              <Button className="w-full rounded-xl gap-2">
                <Search className="h-4 w-4" /> Browse all products
              </Button>
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TrendingSlider({ terms, onSelect }: { terms: string[]; onSelect: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || terms.length === 0) return;
    const total = el.scrollWidth / 2;
    let raf: number;
    let pos = 0;
    function step() {
      pos += 0.4;
      if (pos >= total) pos = 0;
      el!.scrollLeft = pos;
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [terms]);

  const doubled = [...terms, ...terms];
  return (
    <div className="pt-4 flex items-center gap-2 max-w-2xl mx-auto overflow-hidden">
      <span className="text-xs text-white/60 shrink-0 font-medium">Trending</span>
      <div ref={ref} className="flex gap-1.5 overflow-hidden" style={{ userSelect: "none" }}>
        {doubled.map((term, i) => (
          <button
            key={i}
            onClick={() => onSelect(term)}
            className="text-xs px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 hover:bg-white/25 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ name, slug, products }: { name: string; slug: string; products: Product[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold tracking-tight capitalize">{name}</h2>
        <Link href={`/products?category=${slug}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.slice(0, 5).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [catsExpanded, setCatsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: summary, isLoading: isSummaryLoading } = useGetStorefrontSummary();
  const { data: categories } = useListCategories();
  const { data: allProducts, isLoading: isProductsLoading } = useListProducts();
  const { data: meData } = useGetCurrentUser();
  const { data: cart } = useGetCart();
  const me = meData?.user ?? null;
  const isStaff = me && (me.role === "admin" || me.role === "pm");
  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      sessionStorage.setItem("initial_assistant_query", query);
      setLocation("/assistant");
    }
  };

  async function handleSignOut() {
    await signOut();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() }),
    ]);
    setLocation("/");
  }

  const categoryGroups = (() => {
    if (!allProducts || !categories) return [];
    const map = new Map<string, Product[]>();
    for (const p of allProducts) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return categories
      .filter(c => (map.get(c.slug)?.length ?? 0) > 0)
      .map(c => ({ slug: c.slug, name: c.name, products: map.get(c.slug) ?? [] }));
  })();

  const VISIBLE_CATS = 4;
  const visibleGroups = catsExpanded ? categoryGroups : categoryGroups.slice(0, VISIBLE_CATS);
  const hasMore = categoryGroups.length > VISIBLE_CATS;
  const isLoading = isSummaryLoading || isProductsLoading;

  return (
    <div className="flex flex-col min-h-[100dvh]">

      {/* ── Mobile-style purple header ── */}
      <section className="bg-primary px-4 pb-6 pt-safe">
        {/* Top action bar */}
        <div className="flex items-center gap-2 pt-3 pb-4">
          {/* Left: shop drawer */}
          <ShopDrawerInner />

          {/* Center: greeting + title */}
          <div className="flex-1 px-2">
            <p className="text-xs text-white/70 font-medium">
              {greeting()}{me ? `, ${me.name.split(" ")[0]}` : ""} 👋
            </p>
            <p className="text-sm font-bold text-white leading-tight">Find your perfect product</p>
          </div>

          {/* Right: theme toggle, notifications, cart */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle variant="home" />

            {me ? (
              <>
                <NotificationsBell enabled={true} variant="home" />
                {isStaff ? (
                  <StaffSidebarTrigger role={me.role as "admin" | "pm"} name={me.name} />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                        <UserCircle2 className="h-5 w-5 text-white" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer"><UserCog className="h-4 w-4" /> Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/referral" className="flex items-center gap-2 cursor-pointer"><Users className="h-4 w-4" /> Referrals</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/security" className="flex items-center gap-2 cursor-pointer"><Lock className="h-4 w-4" /> Security</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/notifications" className="flex items-center gap-2 cursor-pointer"><Bell className="h-4 w-4" /> Notifications</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/support" className="flex items-center gap-2 cursor-pointer"><LifeBuoy className="h-4 w-4" /> Support</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive gap-2 cursor-pointer">
                        <LogOut className="h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <Link href="/account">
                <button className="flex h-9 items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-3 text-xs font-semibold text-white transition-colors">
                  Sign in
                </button>
              </Link>
            )}

            <Link href="/cart">
              <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                <ShoppingBag className="h-5 w-5 text-white" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleAskAI}>
          <div className="flex items-center bg-white/15 hover:bg-white/20 focus-within:bg-white/20 rounded-2xl px-4 py-3 gap-3 transition-colors border border-white/20">
            <Search className="h-4 w-4 text-white/60 shrink-0" />
            <input
              type="text"
              placeholder="Search for products..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="submit" className="shrink-0 flex h-7 items-center gap-1 rounded-full bg-white/20 px-3 text-xs font-semibold text-white hover:bg-white/30 transition-colors">
                Ask AI
              </button>
            )}
          </div>
        </form>

        {/* Trending */}
        {summary?.trendingSearches && summary.trendingSearches.length > 0 && (
          <TrendingSlider
            terms={summary.trendingSearches}
            onSelect={(term) => {
              sessionStorage.setItem("initial_assistant_query", `I'm looking for ${term}`);
              setLocation("/assistant");
            }}
          />
        )}
      </section>

      {/* Featured Carousel */}
      <section className="py-8 container max-w-screen-xl mx-auto px-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-serif font-bold tracking-tight">Featured</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">Handpicked products.</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" size="sm" className="gap-1 group text-xs">
              View all <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        <FeaturedCarousel />
      </section>

      {/* Category rows */}
      <section className="pb-12 container max-w-screen-xl mx-auto px-6 space-y-10">
        {isLoading ? (
          <div className="space-y-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-40 rounded" />
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
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No products yet.</p>
            <p className="text-sm mt-1">Add some products in the admin panel to get started.</p>
          </div>
        ) : (
          <>
            {visibleGroups.map((group) => (
              <CategoryRow key={group.slug} slug={group.slug} name={group.name} products={group.products} />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setCatsExpanded((e) => !e)} className="gap-2">
                  {catsExpanded ? (
                    <><ChevronUp className="h-4 w-4" /> Show less</>
                  ) : (
                    <><ChevronDown className="h-4 w-4" /> Show {categoryGroups.length - VISIBLE_CATS} more categories</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
