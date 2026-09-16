#!/usr/bin/env node
//
// Guards the invariants that nothing else checks, and that have all actually
// gone wrong at least once in this repository:
//
//   - package.json and CARD_VERSION drifting apart, so the card reports a
//     version that matches neither the tag nor the source
//   - hacs.json naming a file the build does not produce
//   - the registered element name and the bundle filename diverging, which
//     leaves the file installable but `custom:<name>` unresolvable
//
// Run it with no argument to check the working tree, or pass a tag to also
// require that the tag agrees with the version:
//
//   node scripts/sanity-check.mjs
//   node scripts/sanity-check.mjs v0.2.0
//
import { readFileSync, statSync } from 'node:fs';

const tag = process.argv[2];
const problems = [];
const checks = [];

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const pkg = JSON.parse(read('package.json'));
const hacs = JSON.parse(read('hacs.json'));
const constants = read('src/const.ts');

const check = (label, actual, expected) => {
  if (actual === expected) {
    checks.push(`  ok   ${label}: ${actual}`);
  } else {
    problems.push(`${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
};

// --- versions ---------------------------------------------------------------
const cardVersion = constants.match(/CARD_VERSION\s*=\s*'([^']+)'/)?.[1];
if (!cardVersion) {
  problems.push('src/const.ts: no CARD_VERSION found');
} else {
  check('CARD_VERSION matches package.json', cardVersion, pkg.version);
}

if (tag) {
  // v1.2.3 and v1.0.0-rc.1 both map to the version without the leading v.
  check('tag matches package.json version', tag.replace(/^v/, ''), pkg.version);
}

// --- the bundle -------------------------------------------------------------
const filename = hacs.filename;
if (!filename) {
  problems.push('hacs.json: no filename');
} else {
  let size = 0;
  try {
    size = statSync(new URL(`../dist/${filename}`, import.meta.url)).size;
  } catch {
    problems.push(`dist/${filename} does not exist -- run \`npm run build\` first`);
  }

  if (size === 0 && !problems.some((p) => p.includes('does not exist'))) {
    problems.push(`dist/${filename} is empty`);
  }

  if (size > 0) {
    checks.push(`  ok   dist/${filename}: ${size} bytes`);

    // The element name Home Assistant resolves `custom:<name>` against has to
    // match the filename, or the file installs cleanly and the card still
    // cannot be placed on a dashboard.
    const elementName = filename.replace(/\.js$/, '');
    const bundle = read(`dist/${filename}`);
    if (bundle.includes(`"${elementName}"`) || bundle.includes(`'${elementName}'`)) {
      checks.push(`  ok   bundle registers "${elementName}"`);
    } else {
      problems.push(`bundle does not mention the element name "${elementName}"`);
    }
  }
}

// --- report -----------------------------------------------------------------
console.log(checks.join('\n'));

if (problems.length) {
  console.log('');
  for (const p of problems) {
    // Recognised by GitHub Actions and surfaced on the run summary.
    console.log(`::error::${p}`);
  }
  console.log(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} checks passed.`);
