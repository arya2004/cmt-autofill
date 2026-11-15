import process from 'node:process';
import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/extension/', import.meta.url));
// Polling also works on mounted workspaces where native file events may be lost.
const watch = process.argv.includes('--watch')
  ? { chokidar: { usePolling: true, interval: 300 } }
  : null;

// One clean, then two independent bundles: popup modules and a classic content script.
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await copyFile(
  new URL('../manifest.json', import.meta.url),
  `${outDir}/manifest.json`,
);
await cp(new URL('../assets/icons/', import.meta.url), `${outDir}/icons`, {
  recursive: true,
});
await copyFile(new URL('../LICENSE', import.meta.url), `${outDir}/LICENSE`);
await build({
  configFile: false,
  root: `${root}/src/popup`,
  base: './',
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: false,
    target: 'chrome120',
    watch,
    rollupOptions: { input: `${root}/src/popup/popup.html` },
  },
});
await build({
  configFile: false,
  root,
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: false,
    target: 'chrome120',
    watch,
    lib: {
      entry: `${root}/src/cmt/contentScript.ts`,
      name: 'CmtAutofill',
      formats: ['iife'],
      fileName: () => 'contentScript.js',
    },
  },
});
