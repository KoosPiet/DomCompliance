"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only, so local development is
 * never affected by stale caches.
 */
export function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
