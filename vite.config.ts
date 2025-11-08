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
    strictPort: false,
    cors: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24678,
      overlay: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@icons': path.resolve(__dirname, './components/icons')
    }
  },
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || ''),
      GEMINI_API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || '')
    }
  }
});
