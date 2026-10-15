import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

/**
 * On native (iOS/Android), OAuth must open in the system browser (Google blocks
 * sign-in inside an embedded WebView) and returns via this app's custom URL
 * scheme (com.psicomanager.app://...) instead of a normal web redirect. This
 * routes that incoming deep link into the same in-app route the web flow
 * already uses, so GoogleCalendarReturn.tsx handles both cases identically.
 *
 * NOT verified on a real device/emulator -- test before relying on it.
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const sub = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      try {
        const parsed = new URL(url);
        navigate(parsed.pathname + parsed.search, { replace: true });
      } catch {
        // Not a URL we can route (e.g. malformed/foreign deep link) -- ignore.
      }
    });

    return () => { sub.then((s) => s.remove()); };
  }, [navigate]);
}
