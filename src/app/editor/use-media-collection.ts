"use client";
import {useState} from "react";
import {moveItem, REMOVAL_NOTICE_MS, restoreRemoved, selectionAfterMove, selectionAfterRemove, selectionAfterRestore} from "./hero-collection";
import {useRemovalNotice} from "./use-removal-notice";

/** Shared selection, busy/notice, library/poster flags, and remove/reorder/undo for section media lists. */
export function useMediaCollection<T>(count: number, noticeMs = REMOVAL_NOTICE_MS) {
  const [selected, setSelected] = useState(count ? 0 : -1);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState(false);
  const [poster, setPoster] = useState(false);
  const [removed, setRemoved] = useRemovalNotice<{item: T; index: number}>(noticeMs);
  const current = selected >= 0 && selected < count ? selected : -1;

  function removeAt(items: readonly T[], index: number, write: (next: T[]) => void) {
    const item = items[index];
    if (!item) return;
    setNotice("");
    setRemoved({item, index});
    const next = items.filter((_, i) => i !== index) as T[];
    write(next);
    setSelected(selectionAfterRemove(index, next.length));
  }

  function reorder(items: readonly T[], from: number, to: number, write: (next: T[]) => void) {
    if (to < 0 || to >= items.length) return;
    write(moveItem(items as T[], from, to));
    setSelected(selectionAfterMove(to, items.length));
  }

  function undoRemoval(items: readonly T[], write: (next: T[]) => void) {
    if (!removed) return;
    write(restoreRemoved(items, removed.item, removed.index));
    setSelected(selectionAfterRestore(removed.index, items.length));
    setRemoved(null);
    setNotice("");
  }

  return {selected, setSelected, current, notice, setNotice, busy, setBusy, library, setLibrary, poster, setPoster, removed, setRemoved, removeAt, reorder, undoRemoval};
}
