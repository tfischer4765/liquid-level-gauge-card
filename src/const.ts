export const CARD_VERSION = '0.2.0';

// Replaced during the build with a hash over everything that influences the
// bundle -- see scripts/source-hash.mjs. Two cards reporting the same hash were
// built from the same inputs; a different hash means something changed, whether
// or not it was ever committed.
//
// The placeholder survives into a bundle only if the build skipped the
// substitution, which is itself worth noticing.
export const SOURCE_HASH = '__SOURCE_HASH__';
