import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/ikm-proxy': {
        target: 'https://ikm.sidoarjokab.go.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ikm-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['X-Frame-Options'];
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['Content-Security-Policy'];
          });
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('html2pdf') || id.includes('html2canvas') || id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('sweetalert2') || id.includes('axios')) {
              return 'vendor-utils';
            }
          }
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Laboratorium Sidoarjo',
        short_name: 'Labkesda',
        description: 'Laboratorium Application',
        theme_color: '#ffffff',
        icons: [{
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /\.(?:js|css|html)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources'
          }
        }
        ]
      }
    })
  ],
})