import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

const STATIC_DIRS = [
  'components',
  'screens',
  'services',
  'app',
  'css',
  'p',
  'e',
  'qr',
  'avaliar',
  'dev',
  'assets',
  'public',
  'sql-run'
];

const STATIC_COPY_TARGETS = [
  { src: '*.html', dest: '.', filter: (p) => !p.includes('/devtool/') },
  { src: '*.js', dest: '.', filter: (p) => !p.startsWith('vite.config') },
  { src: '*.css', dest: '.' },
  { src: 'manifest.webmanifest', dest: '.' },
  { src: 'config.example.js', dest: '.' },
  ...STATIC_DIRS.map((dir) => ({
    src: `${dir}/**/*`,
    dest: dir,
    filter: (p) => !p.endsWith('/.gitkeep')
  }))
];

export default defineConfig({
  root: ROOT,
  publicDir: false,
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        pwa: resolve(ROOT, 'vite-entry.js')
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: STATIC_COPY_TARGETS,
      silent: false
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      filename: 'sw.js',
      includeAssets: [
        'assets/icons/icon.svg',
        'assets/icons/icon-192.png',
        'assets/icons/icon-512.png',
        'manifest.webmanifest'
      ],
      manifest: {
        name: 'Ranking Pro',
        short_name: 'Ranking Pro',
        description: 'Reputação verificada por QR — avaliações reais de clientes.',
        theme_color: '#08080f',
        background_color: '#08080f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/index.html',
        lang: 'pt-BR',
        icons: [
          {
            src: '/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,png,svg,webp,woff2,webmanifest}'
        ],
        globIgnores: [
          '**/devtool/**',
          '**/.smoke-*',
          '**/node_modules/**',
          '**/sql/**',
          '**/migrations/**'
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: null
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
});