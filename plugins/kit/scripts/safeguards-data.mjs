// The Safeguards data comment in a change's design.md, shared by ready.mjs (writes it) and verify.mjs (reads it),
// so the format lives in one place (build-safeguards design D1, D7). Zero dependencies, no imports.

export const SAFEGUARDS_DATA = /<!-- kit-safeguards-data (\{[\s\S]*?\}) -->/;

/** The Safeguards data in a design.md text, or null. The last comment that parses wins: a design that mentions the
 *  format in prose (`<!-- kit-safeguards-data {...} -->`) must not hide the real one (found at verify, 2026-10-18). */
export function parseSafeguards(text) {
  const all = [...String(text ?? '').matchAll(new RegExp(SAFEGUARDS_DATA.source, 'g'))];
  for (const m of all.reverse()) {
    try { const d = JSON.parse(m[1]); if (d && typeof d === 'object' && d.ratings) return d; } catch { /* prose, not data */ }
  }
  return null;
}

export const dataComment = data => `<!-- kit-safeguards-data ${JSON.stringify(data)} -->`;

/** Did the user choose this safeguard? (verify follows the choice, not the ratings: decided at verify, 2026-10-18) */
export const chose = (sg, id) => !!sg?.chosen?.includes(id);
