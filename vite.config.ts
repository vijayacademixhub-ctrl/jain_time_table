import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Injects <link rel="preload"> tags for the two latin font files so text
 * renders in the brand faces on first paint (no late swap, no layout shift).
 */
function preloadFonts(): Plugin {
  const wanted = /(inter-latin-wght-normal|instrument-serif-latin-400-normal)[^/]*\.woff2$/;
  return {
    name: 'ttp-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const fonts = Object.keys(ctx.bundle).filter((f) => wanted.test(f));
        return {
          html,
          tags: fonts.map((f) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' },
            injectTo: 'head-prepend' as const,
          })),
        };
      },
    },
  };
}

/** Source modules each route needs (mirrors src/routes.ts). */
const ROUTE_SOURCES: Record<string, string[]> = {
  '/committee': ['committee/CommitteeLayout', 'committee/Dashboard'],
  '/committee/builder': ['committee/CommitteeLayout', 'committee/builder/Builder'],
  '/committee/daily': ['committee/CommitteeLayout', 'committee/Daily'],
  '/committee/leave': ['committee/CommitteeLayout', 'committee/LeaveApprovals'],
  '/committee/rooms': ['committee/CommitteeLayout', 'committee/Rooms'],
  '/committee/workload': ['committee/CommitteeLayout', 'committee/Workload'],
  '/committee/assistant': ['committee/CommitteeLayout', 'committee/Assistant'],
  '/committee/upload': ['committee/CommitteeLayout', 'committee/Upload'],
  '/committee/audit': ['committee/CommitteeLayout', 'committee/Audit'],
  '/committee/backup': ['committee/CommitteeLayout', 'committee/Backup'],
  '/calculator': ['Calculator'],
  '/faculty': ['faculty/FacultyLayout', 'faculty/MyTimetable'],
  '/faculty/leave': ['faculty/FacultyLayout', 'faculty/ApplyLeave'],
  '/faculty/history': ['faculty/FacultyLayout', 'faculty/LeaveHistory'],
  '/student': ['student/StudentView'],
  '/perf': ['Perf'],
};

/**
 * Deep links (e.g. /student) would otherwise discover their code only after the entry runs.
 * This emits a tiny inline script that starts those downloads alongside the entry.
 */
function routePreload(): Plugin {
  return {
    name: 'ttp-route-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
        const byFile = new Map(chunks.map((c) => [c.fileName, c]));
        const closure = (file: string, seen = new Set<string>()) => {
          if (seen.has(file)) return seen;
          seen.add(file);
          const c = byFile.get(file);
          if (c && c.type === 'chunk') for (const dep of c.imports) closure(dep, seen);
          return seen;
        };
        const entry = chunks.find((c) => c.type === 'chunk' && c.isEntry);
        const inEntry = entry ? closure(entry.fileName) : new Set<string>();
        const map: Record<string, string[]> = {};
        for (const [route, sources] of Object.entries(ROUTE_SOURCES)) {
          const files = new Set<string>();
          for (const src of sources) {
            const chunk = chunks.find((c) => c.type === 'chunk' && c.facadeModuleId?.replace(/\\/g, '/').endsWith(`/src/pages/${src}.tsx`));
            if (chunk) for (const f of closure(chunk.fileName)) if (!inEntry.has(f)) files.add(f);
          }
          if (files.size) map[route] = [...files];
        }
        const script = `(function(){var m=${JSON.stringify(map)};var p=location.pathname.replace(/\\/+$/,'')||'/';var f=m[p];if(!f)return;for(var i=0;i<f.length;i++){var l=document.createElement('link');l.rel='modulepreload';l.href='/'+f[i];document.head.appendChild(l);}})();`;
        return { html, tags: [{ tag: 'script', children: script, injectTo: 'head' as const }] };
      },
    },
  };
}

/**
 * `vite preview` mirrors Cloudflare Pages: "/" gets the pre-rendered index.html,
 * every other app route gets the app.html shell (public/_redirects does this in production).
 */
function previewSpaFallback(): Plugin {
  return {
    name: 'ttp-preview-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? '/').split('?')[0];
        if (req.method === 'GET' && path !== '/' && !path.includes('.')) req.url = '/app.html';
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts(), routePreload(), previewSpaFallback()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
});
