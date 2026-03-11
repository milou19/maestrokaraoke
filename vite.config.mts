import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import * as process from 'process';
import { visualizer } from 'rollup-plugin-visualizer';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import ReactCompilerBabelPlugin from 'babel-plugin-react-compiler';

const certPath = './config/crt/server.pem';
const keyPath = './config/crt/server.key';
const customCert = fs.existsSync(certPath);

if (!customCert) {
  console.log('No custom cert found, Service Worker might not work. Check README.md how to fix it');
}

// https://vitejs.dev/config/
export default defineConfig({
  experimental: {
    // @ts-expect-error missing types for the lib
    enableNativePlugin: true,
  },
  plugins: [
    sentryVitePlugin({
      applicationKey: 'allkaraoke-party-sentry-key',
    }),
    ReactCompilerBabelPlugin,
    react({
      babel: {
        plugins: [
          '@emotion',
          [
            'transform-imports',
            {
              '@mui/icons-material': {
                transform: '@mui/icons-material/${member}',
                preventFullImport: true,
              },
              '@mui/material': {
                transform: '@mui/material/${member}',
                preventFullImport: true,
              },
            },
          ],
        ],
      },
      jsxImportSource: process.env.NODE_ENV === 'development' ? '@welldone-software/why-did-you-render' : undefined,
    }),
    tsconfigPaths(),
    visualizer(),
    !customCert && basicSsl(),
    // Prerender désactivé pour éviter les pages vides au déploiement
    null,
  ],
  // Injection forcée des variables pour le navigateur
  define: {
    'process.env.VITE_APP_DATA_URL': JSON.stringify('https://asvarox.github.io/allkaraoke-data/'),
  },
  base: '/',
  build: {
    outDir: 'build',
    sourcemap: !process.env.FAST_BUILD,
    reportCompressedSize: !process.env.FAST_BUILD,
  },
  server: {
    port: 3000,
    open: 'https://localhost:3000',
    https: {
      key: fs.readFileSync(customCert ? keyPath : './config/crt/dummy.key'),
      cert: fs.readFileSync(customCert ? certPath : './config/crt/dummy.pem'),
    },
  },
  test: {
    include: ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    environment: 'happy-dom',
    setupFiles: 'src/setupTests.ts',
  },
});