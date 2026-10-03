"use client";

import { useMemo, useSyncExternalStore } from "react";

import { applyQuizResult, WEAK_SPOT_LIMIT, type WeakSpot } from "@/lib/weak-spots";

// The learner's own library, kept on this device only (no account, nothing sent anywhere): saved moments,
// recent questions and where they stopped watching. Every read and write tolerates blocked storage
// (private mode, disabled site data), in which case the features simply show nothing.

export type SavedMoment = {
  segmentId: number;
  lectureId: string;
  publicId: string;
  title: string;
  speaker: string | null;
  startS: number;
  endS: number;
  text: string;
  savedAt: number;
};
export type RecentQuestion = { question: string; answerId: string | null; at: number };
export type WatchProgress = { lectureId: string; publicId: string; title: string; t: number; durationS: number; at: number };

const KEYS = {
  moments: "pravaha-saved-moments",
  questions: "pravaha-recent-questions",
  progress: "pravaha-watch-progress",
  weak: "pravaha-weak-spots",
} as const;
type Key = (typeof KEYS)[keyof typeof KEYS];

const CHANGE = "pravaha-saved-change";
const LIMITS: Record<Key, number> = { [KEYS.moments]: 100, [KEYS.questions]: 30, [KEYS.progress]: 12, [KEYS.weak]: WEAK_SPOT_LIMIT };

function readRaw(key: Key): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write<T>(key: Key, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, LIMITS[key])));
    window.dispatchEvent(new Event(CHANGE));
  } catch {
    // Storage blocked or full: nothing to do.
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The raw string is the snapshot (stable between renders); parsing happens in useMemo.
function useStored<T>(key: Key): T[] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null);
  return useMemo(() => parse<T>(raw), [raw]);
}

export const useSavedMoments = () => useStored<SavedMoment>(KEYS.moments);
export const useRecentQuestions = () => useStored<RecentQuestion>(KEYS.questions);
export const useWatchProgress = () => useStored<WatchProgress>(KEYS.progress);
export const useWeakSpots = () => useStored<WeakSpot>(KEYS.weak);

// Quiz answers feed the weak spots: a wrong answer adds the question, a right one clears it.
export function recordQuizResult(spot: WeakSpot, correct: boolean) {
  write(KEYS.weak, applyQuizResult(parse<WeakSpot>(readRaw(KEYS.weak)), spot, correct));
}

export function removeWeakSpot(key: string) {
  write(KEYS.weak, parse<WeakSpot>(readRaw(KEYS.weak)).filter((s) => s.key !== key));
}

export function toggleSavedMoment(moment: Omit<SavedMoment, "savedAt">): boolean {
  const items = parse<SavedMoment>(readRaw(KEYS.moments));
  const exists = items.some((m) => m.segmentId === moment.segmentId);
  write(KEYS.moments, exists ? items.filter((m) => m.segmentId !== moment.segmentId) : [{ ...moment, savedAt: Date.now() }, ...items]);
  return !exists;
}

export function clearSaved(kind: keyof typeof KEYS) {
  write(KEYS[kind], []);
}

export function recordQuestion(question: string, answerId: string | null) {
  const key = question.trim().toLowerCase();
  const items = parse<RecentQuestion>(readRaw(KEYS.questions)).filter((q) => q.question.trim().toLowerCase() !== key);
  write(KEYS.questions, [{ question: question.trim(), answerId, at: Date.now() }, ...items]);
}

// Kept only while there's something left to watch: the first 10 s don't count, and a finished session is dropped.
export function recordProgress(p: Omit<WatchProgress, "at">) {
  const items = parse<WatchProgress>(readRaw(KEYS.progress)).filter((x) => x.lectureId !== p.lectureId);
  const unfinished = p.t >= 10 && p.durationS > 0 && p.t < p.durationS * 0.95;
  write(KEYS.progress, unfinished ? [{ ...p, at: Date.now() }, ...items] : items);
}
