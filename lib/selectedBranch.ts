"use client";

import { useEffect, useState } from "react";
import { isBranchId, type BranchId } from "@/lib/branches";

/**
 * The branch the guest picked on arrival (or last booked at). Kept in the
 * browser only; the gallery, booking form and WhatsApp button start from it.
 */

export const BRANCH_STORAGE_KEY = "alexa-branch";
const CHANGE_EVENT = "alexa:branch-change";

export function readSelectedBranch(): BranchId | null {
  try {
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
    return isBranchId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function setSelectedBranch(branch: BranchId): void {
  try {
    localStorage.setItem(BRANCH_STORAGE_KEY, branch);
  } catch {
    // private mode: the choice just isn't remembered
  }
  window.dispatchEvent(new CustomEvent<BranchId>(CHANGE_EVENT, { detail: branch }));
}

/** Current branch choice, updated live when the guest picks another. */
export function useSelectedBranch(): BranchId | null {
  const [branch, setBranch] = useState<BranchId | null>(null);

  useEffect(() => {
    setBranch(readSelectedBranch());
    const onChange = (event: Event) => setBranch((event as CustomEvent<BranchId>).detail);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return branch;
}
