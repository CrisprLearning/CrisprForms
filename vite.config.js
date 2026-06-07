// Vite config for the standalone CrisprForms repo, deployed to GitHub Pages
// at the custom domain forms.crisprlearning.com (served from the `docs/` folder
// on `main`). The custom domain serves from root, so `base` stays '/'.

import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const OUT_DIR = 'docs';

// Rewrite the "/submission" route to index.html so the dev/preview server can
// read the ?id and ?key query params from window.location and render the form.
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

// The app routes on pathname (/submission, /preview, /read) but GitHub Pages is
// static and only resolves /index.html. Emitting 404.html as a copy of
// index.html makes Pages serve the SPA for any deep link, where App.jsx then
// reads the path + query params client-side.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const dir = resolve(process.cwd(), OUT_DIR);
      copyFileSync(resolve(dir, 'index.html'), resolve(dir, '404.html'));
    },
  };
}

export default defineConfig({
  plugins: [react(), submissionRouteFallback(), spaFallback()],
  server: { port: 5175, host: true, open: '/submission?id=ADMISSION_FORM&key=ui9wr90et' },
  build: { outDir: OUT_DIR, emptyOutDir: true },
});
