import "server-only";

import { randomBytes } from "node:crypto";
import { BRANCHES, type BranchId } from "@/lib/branches";

/** "SNG-4F2K9C": branch prefix + 6 characters that can't be misread (no 0/O, 1/I). */
export function makeReference(branch: BranchId): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let tail = "";
  for (const byte of bytes) tail += alphabet[byte % alphabet.length];
  return `${BRANCHES[branch].refPrefix}-${tail}`;
}
