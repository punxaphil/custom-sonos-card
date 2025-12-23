/// <reference types="vitest" />

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: false,
    outDir: 'dist',
    rollupOptions: {
      input: 'src/main.ts',

      output: {
        entryFileNames: 'custom-sonos-card.js',
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
