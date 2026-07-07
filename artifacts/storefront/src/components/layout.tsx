import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  useGetCurrentUser,
  signOut,
  getGetCurrentUserQueryKey,
  getGetCartQueryKey,
  getListOrdersQueryKey,
  getListChatMessagesQueryKey,
} from "@workspace/api-client-react";
import {
  ShoppingBag,
  MessageSquare,
  Package,
  Store,
  LogOut,
  UserCircle2,
  UserCog,
  Lock,
  Users,
  Bell,
  LifeBuoy,
  ChevronDown,
  Search,
  Home,
  Tag,
  Zap,
  Cpu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { StaffSidebarTrigger } from "@/components/staff-sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { ThemeToggle } from "@/components/theme-toggle";

const SHOP_NAV = [
  { href: "/products", icon: Store, label: "All Products" },
  { href: "/products?sort=featured", icon: Zap, label: "Featured" },
  { href: "/products?sort=new", icon: Tag, label: "New Arrivals" },
  { href: "/products?sort=sale", icon: Tag, label: "Sale" },
  { href: "/assistant", icon: Cpu, label: "Ask AI" },
];

function ShopDrawer() {
  const [location] = useLocation();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
          <Store className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline">Shop</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Header */}
        <div className="bg-primary px-6 py-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-white text-lg leading-tight">Shop</p>
            <p className="text-xs text-white/70">Browse AllMart</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SHOP_NAV.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href.split("?")[0]));
            const ItemIcon = item.icon;
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
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

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();
  const { data: meData } = useGetCurrentUser();
  const me = meData?.user ?? null;

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const isHome = location === "/" || location === "/dashboard";
  const isAssistant = location === "/assistant";
  const isAuthPage = location === "/account";
  const isStaff = me && (me.role === "admin" || me.role === "pm");

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

  const navLink = (href: string, icon: React.ReactNode, label: string) => {
    const active = location === href || (href !== "/" && location.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:text-primary ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {/* Hide sticky header on home page — home provides its own mobile-style header */}
      {!isHome && (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-13 max-w-screen-2xl items-center gap-2 px-4">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 mr-2">
              <img
                src="/logo.jpeg"
                alt="AllMart"
                className="h-9 w-9 rounded-lg object-cover"
              />
            </Link>

            {/* Primary nav */}
            <nav className="flex items-center gap-0.5">
              <ShopDrawer />
              {me && navLink("/orders", <Package className="h-4 w-4 shrink-0" />, "Orders")}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right-side actions */}
            <div className="flex items-center gap-1">
              <ThemeToggle />

              {me ? (
                <>
                  {isStaff ? (
                    <StaffSidebarTrigger role={me.role as "admin" | "pm"} name={me.name} />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/5 border border-primary/10 max-w-[130px] hover:bg-primary/10 transition-colors">
                          <UserCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{me.name}</span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                            <UserCog className="h-4 w-4" /> Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/referral" className="flex items-center gap-2 cursor-pointer">
                            <Users className="h-4 w-4" /> Referrals & Bonus
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/security" className="flex items-center gap-2 cursor-pointer">
                            <Lock className="h-4 w-4" /> Security
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/notifications" className="flex items-center gap-2 cursor-pointer">
                            <Bell className="h-4 w-4" /> Notifications
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/support" className="flex items-center gap-2 cursor-pointer">
                            <LifeBuoy className="h-4 w-4" /> Support
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive gap-2 cursor-pointer">
                          <LogOut className="h-4 w-4" /> Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <NotificationsBell enabled={true} />
                  {!isStaff && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary sm:hidden"
                      onClick={handleSignOut}
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Link href="/account">
                  <Button size="sm" className="h-8 px-3 text-xs">Sign in</Button>
                </Link>
              )}

              <Link href="/cart">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-8 w-8 rounded-full border-border/50 hover:bg-primary/10 hover:text-primary"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="sr-only">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!isAssistant && !isAuthPage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/assistant">
            <Button
              size="lg"
              className="rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 h-12 px-5 text-sm animate-in slide-in-from-bottom-4 fade-in duration-500"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
