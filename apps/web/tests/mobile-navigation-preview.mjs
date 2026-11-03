// Isolated navigation fixture: node tests/mobile-navigation-preview.mjs
// Open http://127.0.0.1:4176/. Uses real sidebar/tabs/router; no auth or API calls.
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const moduleId = "\0mobile-navigation-preview.js";
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Mobile navigation visual fixture</title></head><body><div id="root"></div><script type="module" src="/mobile-navigation-preview.js"></script></body></html>';
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("../", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 4176, strictPort: true },
  plugins: [react(), tailwindcss(), {
    name: "mobile-navigation-visual-fixture",
    resolveId(id) { if (id === "/mobile-navigation-preview.js") return moduleId; },
    load(id) {
      if (id !== moduleId) return;
      return `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { createRouter, createRootRoute, createRoute, RouterProvider, Outlet, Link, useRouterState } from '@tanstack/react-router';
        import { MobileBottomNavigation } from '/src/components/common-ui/MobileBottomNavigation.tsx';
        import { AppSidebar } from '/src/components/common-ui/AppSideBar.tsx';
        import { SidebarProvider, SidebarInset, SidebarTrigger } from '/src/components/ui/sidebar.tsx';
        import '/src/styles.css';
        const h = React.createElement;
        function Layout() {
          return h(SidebarProvider, { defaultOpen: true }, h(AppSidebar),
            h(SidebarInset, { className: 'min-h-svh min-w-0' },
              h('header', { className: 'sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-white/80 px-3' },
                h(SidebarTrigger, { className: 'hidden md:inline-flex' }),
                h('strong', { className: 'text-[var(--sea-ink)]' }, 'Fidel'),
                h(Link, { to: '/settings', className: 'ml-auto rounded-xl px-3 py-2 text-sm' }, 'Settings')),
              h('main', { className: 'min-w-0 flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0' }, h(Outlet))),
            h(MobileBottomNavigation));
        }
        function Page() {
          const path = useRouterState({ select: state => state.location.pathname });
          return h('div', null,
            h('h1', { className: 'text-2xl font-bold text-[var(--sea-ink)]' }, path),
            h('p', { className: 'mt-3 text-sm text-[var(--sea-ink)]/65' }, 'Navigation preview — no learner data.'),
            h(Link, { to: '/Learn/demo', className: 'mt-5 inline-block rounded-xl bg-[var(--sea-ink)] px-4 py-3 text-white' }, 'Open lesson'),
            h('div', { style: { height: 900 }, 'aria-hidden': true }),
            h('button', { className: 'mb-2 min-h-12 rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-white' }, 'Last page action'));
        }
        const root = createRootRoute({ component: Layout });
        const paths = ['/Home', '/Learn', '/Learn/demo', '/review', '/dictionary', '/profile', '/settings', '/'];
        const routes = paths.map(path => createRoute({ getParentRoute: () => root, path, component: Page }));
        const router = createRouter({ routeTree: root.addChildren(routes) });
        createRoot(document.getElementById('root')).render(h(RouterProvider, { router }));
      `;
    },
    configureServer(vite) {
      vite.middlewares.use((request, response, next) => {
        if (request.url?.startsWith('/@') || request.url?.startsWith('/src/') || request.url?.includes('.')) return next();
        void vite.transformIndexHtml(request.url ?? '/', html).then(page => {
          response.setHeader('Content-Type', 'text/html');
          response.end(page);
        }).catch(next);
      });
    },
  }],
});
await server.listen();
server.printUrls();
