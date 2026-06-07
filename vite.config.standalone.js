// Standalone Vite config — used AFTER extracting `forms-app/` to its own repo
// (the public host forms.crisprlearning.com). Inside the parent monorepo this
// file is unused (the parent's vite.config.js owns the dev server and rewrites
// /submission → /forms.html).
//
// On extraction:
//   1. Rename this file to `vite.config.js` at the new repo root.
//   2. Keep `index.html` at the new repo root.
//   3. `npm install && npm run dev`.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Rewrite the "/submission" route to index.html so the SPA can read the
// ?id and ?key query params from window.location and render the form.
function submissionRouteFallback() {
  const rewrite = (req, _res, next) => {
    const url = (req.url || '/').split('?')[0];
    const last = url.split('/').pop() || '';
    const isAsset = last.includes('.') || url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/');
    if (!isAsset) req.url = '/index.html';
    next();
  };
  return {
    name: 'submission-route-fallback',
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  plugins: [react(), submissionRouteFallback()],
  server: { port: 5175, host: true, open: '/submission?id=ADMISSION_FORM&key=ui9wr90et' },
  build: { outDir: 'dist', emptyOutDir: true },
});
