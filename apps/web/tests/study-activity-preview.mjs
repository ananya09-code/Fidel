// Visual fixture only: node tests/study-activity-preview.mjs
// Open http://127.0.0.1:4175/ or add ?empty. No auth/backend requests are made.
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const moduleId = "\0study-activity-preview.js";
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Study activity visual fixture</title></head><body><div id="root"></div><script type="module" src="/study-activity-preview.js"></script></body></html>';
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("../", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 4175, strictPort: true },
  plugins: [react(), tailwindcss(), {
    name: "study-activity-visual-fixture",
    resolveId(id) { if (id === "/study-activity-preview.js") return moduleId; },
    load(id) {
      if (id !== moduleId) return;
      return `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { StudyActivityCalendar } from '/src/components/profile-ui/StudyActivityCalendar.tsx';
        import '/src/styles.css';
        const empty = new URLSearchParams(location.search).has('empty');
        const days = Array.from({ length: 365 }, (_, index) => ({
          date: new Date(Date.UTC(2025, 10, 4 + index)).toISOString().slice(0, 10),
          answers: empty || index % 7 < 2 ? 0 : (index * 13) % 25,
        }));
        const activity = { timezone: 'Africa/Addis_Ababa', start_date: days[0].date,
          end_date: days.at(-1).date, days };
        createRoot(document.getElementById('root')).render(
          React.createElement('main', { style: { padding: '24px 16px', maxWidth: '1100px', margin: '0 auto' } },
            React.createElement(StudyActivityCalendar, { activity }))
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
