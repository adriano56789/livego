import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
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
