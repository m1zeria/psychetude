import { defineConfig } from 'vite';

export default defineConfig({
  // Use the repo subpath on GitHub Pages, while keeping local dev working.
  base: process.env.NODE_ENV === 'production' ? '/psychetude/' : './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
