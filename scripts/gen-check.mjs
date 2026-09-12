/**
 * Regenerate, then fail if anything changed.
 *
 * WHY `npm run gen` ALONE WAS NOT ENOUGH
 *
 * The pre-push hook ran the generator and then the tests, which looks like it guarantees
 * the committed `src/generated` matches the contracts. It does not. Generation rewrites
 * the working tree; the hook then tested the rewritten files and let the push through
 * carrying the OLD ones, because the regenerated changes were never staged. A tree with
 * stale addresses or a stale ABI could be pushed by a hook that had just proved the fresh
 * ones were fine.
 *
 * That is the whole failure mode this package was built to prevent, reintroduced one level
 * up: generation makes drift impossible *in the artifact*, and this makes it impossible
 * *in the commit*.
 *
 * Exits non-zero with the list of differing files, so CI and the hook both get a
 * actionable message rather than a diff to interpret.
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SDK = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(...args) {
  return execFileSync("git", args, { cwd: SDK, encoding: "utf8" }).trim();
}

/**
 * True when `src/generated` differs from HEAD in content.
 *
 * Deliberately NOT `git status --porcelain`, which was the first implementation and was
 * wrong on Windows. `status` decides a file is modified from its stat data (mtime, size)
 * before comparing bytes, and regenerating a file always changes its mtime. With
 * `core.autocrlf=true` the working copy is also CRLF where the blob is LF, so the size
 * differs too -- and the stale stat cache persisted across runs, which made it look like a
 * genuine, reproducible failure rather than a false positive. It reported STALE three
 * times in a row on a tree where `git diff` and `git diff --cached` were both empty.
 *
 * `git diff HEAD` compares content and applies the same line-ending normalisation to both
 * sides, so it answers the question actually being asked: do the committed generated files
 * say the same thing as freshly generated ones?
 *
 * Untracked files are asked for separately, since `diff` by definition cannot see a
 * generated file that has never been added -- a new ABI would otherwise pass silently.
 */
function generatedDiffers() {
  try {
    execFileSync("git", ["diff", "--quiet", "HEAD", "--", "src/generated"], { cwd: SDK });
  } catch {
    return git("diff", "--name-only", "HEAD", "--", "src/generated");
  }
  const untracked = git("ls-files", "--others", "--exclude-standard", "--", "src/generated");
  return untracked || "";
}

// A standalone checkout has no contracts to generate from; the generator says so and
// exits 0, and there is nothing for this to compare. Detect it the same way rather than
// reading an empty diff as success.
const output = execFileSync(process.execPath, [resolve(SDK, "scripts/generate.mjs")], {
  cwd: SDK,
  encoding: "utf8",
});
if (output.includes("standalone checkout")) {
  console.log("standalone checkout — nothing to check, src/generated is the source here.");
  process.exit(0);
}

const dirty = generatedDiffers();
if (!dirty) {
  console.log("src/generated is in sync with contracts/.");
  process.exit(0);
}

console.error("src/generated is STALE — regenerating changed these files:\n");
for (const line of dirty.split("\n")) console.error(`  ${line.trim()}`);
console.error(`
The contracts moved and the committed generated files did not follow. They have just been
regenerated in your working tree, so the fix is to review and commit them:

    git -C packages/sdk add src/generated && git commit

Do not revert them to make this pass. A stale ABI decodes to the wrong value with no
revert, and a stale address points at a contract that is not there.`);
process.exit(1);
