// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'RealmsHP — Star Realms Tracker',
        short_name: 'RealmsHP',
        description: 'Two-player Authority tracker for Star Realms.',
        theme_color: '#020c1a',
        background_color: '#020c1a',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png',  sizes: '64x64',  type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,woff,woff2}'],
        navigateFallback: '/',
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
