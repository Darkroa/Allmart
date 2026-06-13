import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";

export function FeaturedCarousel() {
  const { data: products } = useListProducts();
  const items = products ?? [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(items.length, 1)), [items.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1)), [items.length]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next, items.length, paused]);

  if (items.length === 0) return null;

  const product = items[current]!;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link href={`/products/${product.id}`} className="block w-full">

        {/* ── Instagram-post style: tall portrait image on top ── */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/2] lg:aspect-[16/9] overflow-hidden bg-muted/20">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Discount badge */}
          {discountPct && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Tag className="h-3 w-3" /> -{discountPct}%
            </div>
          )}

          {/* Prev / Next arrows overlaid on image */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/40 flex items-center justify-center hover:bg-background shadow transition-colors z-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border/40 flex items-center justify-center hover:bg-background shadow transition-colors z-10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* ── Text / info panel below the image ── */}
        <div className="flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {product.category}
          </span>
          <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base line-clamp-3">
            {product.description}
          </p>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <span className="text-xl sm:text-2xl font-bold text-primary">{fmt(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm sm:text-base text-muted-foreground line-through">{fmt(product.originalPrice)}</span>
            )}
          </div>
          <Button className="w-fit gap-2 mt-2" size="lg">Shop now</Button>
        </div>
      </Link>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {items.slice(0, 10).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary" : "w-1.5 bg-primary/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
