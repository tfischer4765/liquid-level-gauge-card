import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';
import { sourceHash } from './scripts/source-hash.mjs';

// Stamps the build-input hash into const.ts on the way through. Note that the
// hasher itself is not part of what it hashes: changing scripts/source-hash.mjs
// changes the stamped value without any build input having changed.
const stampSourceHash = () => ({
  name: 'stamp-source-hash',
  transform(code, id) {
    if (!id.endsWith('const.ts')) return null;
    return { code: code.replace('__SOURCE_HASH__', sourceHash().hash.slice(0, 12)), map: null };
  },
});

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
  contentBase: ['./dist'],
  host: '0.0.0.0',
  // See rollup.config.dev.js: port 5000 is taken by macOS AirPlay Receiver.
  port: 5001,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
    // Without this the server sends no cache directives at all, so browsers
    // apply heuristic caching and keep serving a stale bundle after a rebuild --
    // which looks exactly like the card not having changed.
    'Cache-Control': 'no-store',
  },
};

const plugins = [
  nodeResolve({}),
  commonjs(),
  // `include` must be set explicitly: the plugin's default pattern `**/*.ts+(|x)`
  // is no longer matched by the picomatch version behind @rollup/pluginutils v3,
  // which silently filters out every .ts file and leaves rollup parsing raw TypeScript.
  typescript({ include: ['src/**/*.ts'] }),
  stampSourceHash(),
  json(),
  babel({
    exclude: 'node_modules/**',
  }),
  dev && serve(serveopts),
  !dev && terser(),
];

// @formatjs/intl-utils, pulled in by custom-card-helpers, ships TypeScript's
// `var __assign = (this && this.__assign) || function () {…}` helpers at module
// top level. In an ES module `this` is undefined, so rollup rewrites it and
// warns -- but falling through to the inline implementation is precisely what
// that idiom is for, and the result works. Silenced for dependencies only, so a
// genuine `this` problem in our own source still gets reported.
const quietVendorThisWarnings = (warning, warn) => {
  const file = warning.id ?? warning.loc?.file ?? '';
  if (warning.code === 'THIS_IS_UNDEFINED' && file.includes('node_modules')) return;
  warn(warning);
};

export default [
  {
    onwarn: quietVendorThisWarnings,
    input: 'src/liquid-level-gauge-card.ts',
    output: {
      dir: 'dist',
      format: 'es',
      inlineDynamicImports: true,
    },
    plugins: [...plugins],
  },
];
