"use client";

import { useEffect } from "react";

// Registers the service worker for PWA installability + push delivery.
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
