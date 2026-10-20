// Where throwaway test folders go (kit-followups design D6; spec: kit-self-test "Unit tests clean up").
// KIT_TEST_DIR, else ../temp next to the repo when it exists (the maintainer's test area), else the system temp.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function testRoot() {
  if (process.env.KIT_TEST_DIR) return process.env.KIT_TEST_DIR;
  const sibling = path.join(REPO, '..', 'temp');
  return fs.existsSync(sibling) ? sibling : os.tmpdir();
}

const made = [];
let hooked = false;

/** Remove `p` (a folder or file) when this process exits; errors ignored. Returns `p`. */
export function cleanupLater(p) {
  if (!hooked) {
    hooked = true;
    process.on('exit', () => { for (const d of made) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* locked: leave it */ } } });
  }
  made.push(p);
  return p;
}

/** A new empty folder under testRoot(); removed when this process exits. */
export function tmpDir(prefix = 'kit-') {
  return cleanupLater(fs.mkdtempSync(path.join(testRoot(), prefix)));
}
