import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        watch: {
          usePolling: true,
          interval: 100,
        },
        hmr: {
          overlay: true,
          clientPort: 3000,
        },
      },
      plugins: [react({
        include: '**/*.{jsx,tsx,ts,js}'
      })],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: [
          {
            find: '@',
            replacement: path.resolve(__dirname, '.')
          },
          {
            find: '@icons',
            replacement: path.resolve(__dirname, './components/icons')
          }
        ]
      }
    };
});
