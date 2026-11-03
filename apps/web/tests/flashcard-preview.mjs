// Isolated visual fixture: node tests/flashcard-preview.mjs
// Open http://127.0.0.1:4174/ (add ?reduced to simulate reduced-motion navigation).
// Uses the real component and styles, without Clerk, backend requests or saved data.
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const previewModule = "\0flashcard-preview.tsx";
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flashcard motion preview</title></head><body><div id="root"></div><script type="module" src="/flashcard-preview.tsx"></script></body></html>';
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("../", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
  plugins: [react(), tailwindcss(), {
    name: "flashcard-visual-fixture",
    resolveId(id) { if (id === "/flashcard-preview.tsx") return previewModule; },
    load(id) {
      if (id !== previewModule) return;
      return `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { FlashcardSession } from '/src/components/learn-ui/lesson/FlashcardSession.tsx';
        import '/src/styles.css';
        if (new URLSearchParams(location.search).has('reduced')) {
          const nativeMatchMedia = window.matchMedia.bind(window);
          window.matchMedia = query => query === '(prefers-reduced-motion: reduce)'
            ? { ...nativeMatchMedia(query), matches: true }
            : nativeMatchMedia(query);
        }
        const words = [
          { id: 'one', word: 'Akkam', meaning: 'Hello', amharic: 'ሰላም' },
          { id: 'two', word: 'Galatoomi', meaning: 'Thank you', amharic: 'አመሰግናለሁ',
            example: 'Thank you for helping me practise a new language today.' },
          { id: 'three', word: 'Nagaatti', meaning: 'Goodbye', amharic: 'ደህና ሁን' }
        ];
        createRoot(document.getElementById('root')).render(
          React.createElement('main', { style: { padding: '16px', minHeight: '100vh' } },
            React.createElement(FlashcardSession, { words, initialWordLimit: 3, resumeActive: true }))
        );
      `;
    },
    configureServer(vite) {
      vite.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/") return next();
        void vite.transformIndexHtml(request.url, html).then((page) => {
          response.setHeader("Content-Type", "text/html");
          response.end(page);
        }).catch(next);
      });
    },
  }],
});
await server.listen();
server.printUrls();
