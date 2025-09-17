import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'anthropic-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: ({ request }) => {
              return request.destination === 'document';
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: ({ request }) => {
              return request.destination === 'image';
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.svg', 'icon-192x192.svg', 'icon-512x512.svg'],
      manifest: {
        name: 'MyPA - Personal Assistant',
        short_name: 'MyPA',
        description: 'AI-powered personal productivity assistant with smart task management and Claude integration',
        theme_color: '#0ea5e9',
        background_color: '#fcfcfd',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'business', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: 'icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-1.png',
            sizes: '1280x720',
            type: 'image/png',
            platform: 'wide',
            label: 'MyPA Desktop Dashboard'
          },
          {
            src: '/screenshots/mobile-1.png',
            sizes: '390x844',
            type: 'image/png',
            platform: 'narrow',
            label: 'MyPA Mobile Interface'
          }
        ],
        shortcuts: [
          {
            name: 'Quick Add Task',
            short_name: 'Add Task',
            description: 'Quickly add a new task',
            url: '/?action=add-task',
            icons: [{ src: '/icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Today\'s Tasks',
            short_name: 'Today',
            description: 'View today\'s priorities and schedule',
            url: '/?view=today',
            icons: [{ src: '/icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'AI Assistant',
            short_name: 'AI Chat',
            description: 'Chat with Claude AI assistant',
            url: '/?view=chat',
            icons: [{ src: '/icon-192x192.svg', sizes: '192x192' }]
          }
        ],
        prefer_related_applications: false,
        edge_side_panel: {
          preferred_width: 400
        }
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  // Performance optimizations
  build: {
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          vendor: ['react', 'react-dom'],
          // AI services chunk (can be lazy loaded)
          ai: ['@anthropic-ai/sdk'],
          // UI components chunk
          ui: ['zustand']
        },
      },
    },
    // Target modern browsers for better optimization
    target: 'esnext',
    // Source maps only in development
    sourcemap: process.env.NODE_ENV === 'development',
  },
  // Optimize assets
  assetsInclude: ['**/*.woff', '**/*.woff2'],
  // Enable dependency pre-bundling for faster dev builds
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
    exclude: ['@anthropic-ai/sdk'] // Exclude large SDKs from pre-bundling
  },
})
