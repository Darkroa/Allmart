import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  signIn,
  signUp,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup" | "forgot";

export default function Account() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("ref")) setMode("signup");
  }, [search]);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setForgotSent(false);
    setShowPassword(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        await fetch("/api/auth/request-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setForgotSent(true);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      let res: { role?: string };
      if (mode === "signin") {
        res = await signIn({ email, password });
      } else {
        const params = new URLSearchParams(search);
        const refCode = params.get("ref");
        if (refCode) {
          const r = await fetch("/api/auth/signup", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, referralCode: refCode }),
          });
          const data = await r.json();
          if (!r.ok) throw Object.assign(new Error(), { response: { data } });
          res = data;
        } else {
          res = await signUp({ name, email, password });
        }
      }
      await queryClient.invalidateQueries({
        queryKey: getGetCurrentUserQueryKey(),
      });
      if (mode === "signup") {
        // New accounts need email verification
        setLocation("/verify-email");
        return;
      }
      const role = res?.role;
      if (role === "admin") setLocation("/admin");
      else if (role === "pm") setLocation("/pm");
      else setLocation("/");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const isSignIn = mode === "signin";
  const isForgot = mode === "forgot";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            {isForgot ? "Reset password" : isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isForgot
              ? "We'll email you a code to reset your password."
              : isSignIn
              ? "Sign in to pick up where you left off."
              : "Save your orders and let the assistant remember you."}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-sm">
          {!isForgot && (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 mb-4">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  isSignIn
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  !isSignIn
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {isForgot && forgotSent ? (
            <div className="px-6 pb-6 pt-4 space-y-4 text-center">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <p className="font-semibold mb-1">Check your inbox</p>
                <p>If an account exists for <strong>{email}</strong>, we've sent a password reset code.</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/reset-password")}>
                Enter reset code
              </Button>
              <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5 px-6 pb-6 pt-2">
              {!isSignIn && !isForgot && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourmail@gmail.com"
                />
              </div>

              {!isForgot && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isSignIn && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignIn ? "current-password" : "new-password"}
                      required
                      minLength={isSignIn ? 1 : 6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignIn ? "••••••••" : "At least 6 characters"}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={submitting}
              >
                {submitting
                  ? isForgot
                    ? "Sending…"
                    : isSignIn
                    ? "Signing in…"
                    : "Creating account…"
                  : isForgot
                  ? "Send reset code"
                  : isSignIn
                  ? "Sign in"
                  : "Create account"}
              </Button>

              {isForgot && (
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => switchMode("signin")}
                >
                  Back to sign in
                </button>
              )}
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our (Allmart T&C){" "}
          <Link href="/" className="underline hover:text-primary">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
