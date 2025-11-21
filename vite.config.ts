import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'LiveGo PWA',
        short_name: 'LiveGo',
        start_url: '/pwa.html',
        scope: '/',
        display: 'standalone',
        background_color: '#111827',
        theme_color: '#111827',
        description: 'Versão PWA para testes de instalação e funcionamento.',
        icons: [
          {
            src: '/images/diamond-yellow.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/diamond-yellow.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        orientation: 'portrait'
      }
    })
  ],

  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24679,
      overlay: true
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@icons': path.resolve(__dirname, './components/icons')
    }
  },

  build: {
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  },

  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
