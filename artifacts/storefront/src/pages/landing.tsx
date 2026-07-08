import { Link } from "wouter";
import {
  ShoppingBag,
  Cpu,
  Truck,
  Shield,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Cpu,
    title: "AI-Powered Shopping",
    desc: "Ask our AI anything — product recommendations, comparisons, or help finding the best deal.",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Zap,
    title: "Flash Sales Daily",
    desc: "Exclusive limited-time deals on top products. Up to 60% off every day.",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Nigeria-wide delivery with real-time tracking. Get your orders quickly.",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Shield,
    title: "Secure & Trusted",
    desc: "Stripe-powered payments. Your money and data are always protected.",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
];

const CATEGORIES = [
  { label: "Electronics", emoji: "💻" },
  { label: "Fashion",     emoji: "👗" },
  { label: "Beauty",      emoji: "💄" },
  { label: "Sports",      emoji: "🏋️" },
  { label: "Books",       emoji: "📚" },
  { label: "Home",        emoji: "🏠" },
  { label: "Shoes",       emoji: "👟" },
  { label: "Toys",        emoji: "🎮" },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0D0B1A]">

      {/* ── Nav bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">AllMart</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
              Sign in
            </Button>
          </Link>
          <Link href="/account?tab=signup">
            <Button size="sm" className="rounded-xl gap-1.5 bg-primary hover:bg-primary/90">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-8 pb-12">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 mb-6">
          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
          <span className="text-xs font-semibold text-primary">Nigeria's AI-Powered Marketplace</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4 max-w-lg">
          Shop Smarter with{" "}
          <span className="text-primary">AllMart AI</span>
        </h1>
        <p className="text-base text-white/60 max-w-sm mb-8 leading-relaxed">
          Discover thousands of products, get AI-powered recommendations, and enjoy daily flash sales — all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <Link href="/account">
            <Button size="lg" className="w-full sm:w-auto rounded-2xl gap-2 bg-primary hover:bg-primary/90 h-12 px-8 text-base font-semibold shadow-lg shadow-primary/30">
              <ShoppingBag className="h-5 w-5" /> Start Shopping
            </Button>
          </Link>
          <Link href="/account">
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl h-12 px-8 text-base font-semibold border-white/20 text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-5 text-xs text-white/40">
          Join thousands of shoppers across Nigeria
        </p>
      </section>

      {/* ── Category chips ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-10">
        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {CATEGORIES.map(c => (
            <Link key={c.label} href="/account">
              <div className="flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3.5 py-1.5 text-sm text-white/70 hover:bg-white/15 hover:text-white transition-colors cursor-pointer">
                <span>{c.emoji}</span>
                <span className="font-medium">{c.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl bg-white/5 border border-white/8 p-5">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${f.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────────────────────────────── */}
      <div className="border-t border-white/8 px-6 py-6 text-center">
        <p className="text-xs text-white/30">
          © 2025 AllMart · Built for Nigerian shoppers
        </p>
      </div>
    </div>
  );
}
