import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: ['src/liquid-level-gauge-card.ts'],
  output: {
    dir: './dist',
    format: 'es',
    inlineDynamicImports: true,
  },
  plugins: [
    resolve(),
    // See rollup.config.js: the default include pattern no longer matches, so
    // every .ts file would be filtered out and passed to rollup untranspiled.
    typescript({ include: ['src/**/*.ts'] }),
    json(),
    babel({
      exclude: 'node_modules/**',
    }),
    terser(),
    serve({
      contentBase: './dist',
      host: '0.0.0.0',
      // Not 5000: macOS binds that port to the AirPlay Receiver (ControlCenter)
      // by default, so the dev server would fail to start with "port in use".
      port: 5001,
      allowCrossOrigin: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),
  ],
};
