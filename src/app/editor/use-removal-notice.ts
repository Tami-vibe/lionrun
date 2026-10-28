"use client";
import {useEffect, useState} from "react";
import {REMOVAL_NOTICE_MS} from "../site/hero-collection";

/** Pass `ms: 0` to keep the toast until dismiss (logos). */
export function useRemovalNotice<T>(ms = REMOVAL_NOTICE_MS) {
  const [removed, setRemoved] = useState<T | null>(null);
  useEffect(() => { if (!removed || ms <= 0) return; const id = window.setTimeout(() => setRemoved(null), ms); return () => window.clearTimeout(id); }, [removed, ms]);
  return [removed, setRemoved] as const;
}
