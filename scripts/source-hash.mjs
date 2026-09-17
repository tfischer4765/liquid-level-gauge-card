// A content hash over everything that influences the bundle, so two artifacts
// can be compared without knowing where they came from: same hash means the
// same build inputs, and therefore the same output.
//
// Deliberately independent of git. A tarball, a vendored copy and a clone all
// hash identically if their contents match, and uncommitted edits change the
// hash on their own -- which is why no "dirty" marker is needed.
//
// Not covered: README, docs/, dev/, .github/, lint and formatter configuration.
// None of them reach the bundle, and a hash that changed on every typo fix in
// the documentation would be useless for the one question it exists to answer.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// package-lock.json matters because the dependencies are compiled *into* the
// bundle: the resolved version of lit is part of the shipped artifact, not just
// of the build environment.
const FILES = ['tsconfig.json', 'rollup.config.js', 'package.json', 'package-lock.json'];
const DIRS = ['src'];

const walk = (dir) =>
  readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

export function sourceHash() {
  const paths = [...FILES.filter((f) => existsInRoot(f)), ...DIRS.flatMap(walk)].sort();

  const hash = createHash('sha256');
  for (const path of paths) {
    // The path goes in too, so that renaming a file changes the hash even when
    // its contents do not.
    hash.update(relative('.', path));
    hash.update('\0');
    hash.update(readFileSync(join(root, path)));
    hash.update('\0');
  }
  return { hash: hash.digest('hex'), files: paths.length };
}

function existsInRoot(path) {
  try {
    statSync(join(root, path));
    return true;
  } catch {
    return false;
  }
}

// Called directly: print the short hash, or --long / --files for detail.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { hash, files } = sourceHash();
  if (process.argv.includes('--files')) {
    const paths = [...FILES.filter((f) => existsInRoot(f)), ...DIRS.flatMap(walk)].sort();
    for (const p of paths) console.log(p);
    console.log(`\n${files} files`);
  }
  console.log(process.argv.includes('--long') ? hash : hash.slice(0, 12));
}
