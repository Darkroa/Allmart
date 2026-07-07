import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useGetStorefrontSummary, useListProducts, useListCategories } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedCarousel } from "@/components/featured-carousel";

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
    <div className="pt-5 flex items-center gap-2 max-w-2xl mx-auto overflow-hidden">
      <span className="text-xs text-muted-foreground shrink-0 font-medium">Trending</span>
      <div ref={ref} className="flex gap-1.5 overflow-hidden" style={{ userSelect: "none" }}>
        {doubled.map((term, i) => (
          <button
            key={i}
            onClick={() => onSelect(term)}
            className="text-xs px-3 py-1 rounded-full bg-card border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors whitespace-nowrap shrink-0"
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

  const { data: summary, isLoading: isSummaryLoading } = useGetStorefrontSummary();
  const { data: categories } = useListCategories();
  const { data: allProducts, isLoading: isProductsLoading } = useListProducts();

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      sessionStorage.setItem("initial_assistant_query", query);
      setLocation("/assistant");
    }
  };

  // Group all products by category, keep first 5 per category
  const categoryGroups = (() => {
    if (!allProducts || !categories) return [];
    const map = new Map<string, Product[]>();
    for (const p of allProducts) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    // Order by the categories list
    return categories
      .filter(c => (map.get(c.slug)?.length ?? 0) > 0)
      .map(c => ({ slug: c.slug, name: c.name, products: map.get(c.slug) ?? [] }));
  })();

  const VISIBLE_CATS = 4;
  const visibleGroups = catsExpanded ? categoryGroups : categoryGroups.slice(0, VISIBLE_CATS);
  const hasMore = categoryGroups.length > VISIBLE_CATS;

  const isLoading = isSummaryLoading || isProductsLoading;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.25rem)]">
      {/* Hero */}
      <section className="relative px-6 py-20 md:py-28 lg:py-36 overflow-hidden bg-background border-b border-border/40">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="container relative z-10 max-w-4xl mx-auto text-center space-y-7">

          {/* Brand identity */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl scale-110" />
              <img
                src="/logo.jpeg"
                alt="AllMart"
                className="relative h-24 w-24 rounded-2xl object-cover shadow-xl ring-2 ring-primary/20"
              />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
                AllMart
              </h1>
              <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI Powered Store
              </span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Tell our AI what you're looking for — no endless scrolling required.
          </p>

          <form onSubmit={handleAskAI} className="relative max-w-2xl mx-auto mt-8 group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-card rounded-full p-2 border-2 border-primary/20 shadow-xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
              <Search className="h-5 w-5 text-muted-foreground ml-3" />
              <Input
                type="text"
                placeholder="Tell me what you need..."
                className="flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 px-3 h-12 placeholder:text-muted-foreground/60"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" size="lg" className="rounded-full h-10 px-6 font-semibold gap-2">
                Ask AI <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {summary?.trendingSearches && summary.trendingSearches.length > 0 && (
            <TrendingSlider
              terms={summary.trendingSearches}
              onSelect={(term) => {
                sessionStorage.setItem("initial_assistant_query", `I'm looking for ${term}`);
                setLocation("/assistant");
              }}
            />
          )}
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="py-10 container max-w-screen-xl mx-auto px-6">
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

      {/* Category rows — 5 products each */}
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
              <CategoryRow
                key={group.slug}
                slug={group.slug}
                name={group.name}
                products={group.products}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCatsExpanded((e) => !e)}
                  className="gap-2"
                >
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
