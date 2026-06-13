import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function useVisitorTracker() {
  const [location] = useLocation();
  const trackedPages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (trackedPages.current.has(location)) return;
    trackedPages.current.add(location);

    const referrer = document.referrer || undefined;

    fetch("/api/visitors/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page: location, referrer }),
    }).catch(() => {});
  }, [location]);
}
