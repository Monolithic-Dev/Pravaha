"use client";

import { useCallback, useSyncExternalStore } from "react";

import { liteUrl } from "@/lib/media";

// Data saver: smaller, lower-quality Cloudinary renditions for slow or metered connections. "auto" (nothing
// stored) turns it on when the browser reports Save-Data or a 2G/3G link; the header switch sets on/off and
// is remembered on this device only. Every read tolerates blocked storage.

export type Mode = "auto" | "on" | "off";
const KEY = "pravaha-data-saver";
const CHANGE = "pravaha-data-saver-change";

type Connection = { saveData?: boolean; effectiveType?: string };

export function readMode(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "on" || v === "off" ? v : "auto";
  } catch {
    return "auto";
  }
}

export function connectionIsSlow(c: Connection | undefined): boolean {
  return !!c && (c.saveData === true || c.effectiveType === "slow-2g" || c.effectiveType === "2g" || c.effectiveType === "3g");
}

// Pure so it is unit-tested: the stored choice wins; otherwise the connection decides.
export function resolveLite(mode: Mode, connection: Connection | undefined): boolean {
  return mode === "on" || (mode === "auto" && connectionIsSlow(connection));
}

function snapshot(): boolean {
  return resolveLite(readMode(), (navigator as Navigator & { connection?: Connection }).connection);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const useDataSaver = () => useSyncExternalStore(subscribe, snapshot, () => false);

export function setDataSaver(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the switch simply doesn't persist.
  }
  window.dispatchEvent(new Event(CHANGE));
}

// Wraps a Cloudinary URL for the current mode: `const lt = useLiteUrl(); <video src={lt(url)} />`.
export function useLiteUrl() {
  const lite = useDataSaver();
  return useCallback((url: string) => (lite ? liteUrl(url) : url), [lite]);
}
