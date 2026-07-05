// ============================================================
// Rank ladder — turns "how many cards solved so far" into a
// military promotion. Works for any total question count: the
// ladder is spread proportionally, so a 4-question hunt and a
// 40-question hunt both walk the full path from Private to General.
// ============================================================

export const rankLadder = [
  "Private",
  "Private First Class",
  "Corporal",
  "Sergeant",
  "Staff Sergeant",
  "Sergeant First Class",
  "Master Sergeant",
  "Second Lieutenant",
  "First Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "Brigadier General",
  "General",
];

// Given how many cards have been correctly answered out of the
// total, returns the rank title that corresponds to that point
// in the ladder. Always lands exactly on the last rank when
// count === total, and on the first rank when count === 0.
export function rankForCount(count, total, ladder = rankLadder) {
  if (total <= 0) return ladder[0];
  if (count <= 0) return ladder[0];
  const idx = Math.min(
    ladder.length - 1,
    Math.max(0, Math.ceil((count / total) * ladder.length) - 1)
  );
  return ladder[idx];
}

export function rankIndexForCount(count, total, ladder = rankLadder) {
  if (total <= 0 || count <= 0) return 0;
  return Math.min(
    ladder.length - 1,
    Math.max(0, Math.ceil((count / total) * ladder.length) - 1)
  );
}
