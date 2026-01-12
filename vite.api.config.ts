import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'services/api.ts'),
      name: 'LiveGoAPI',
      fileName: (format) => `livego-api.${format}.js`,
      formats: ['es', 'umd']
    },
    outDir: 'dist-api',
    emptyOutDir: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'axios'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          axios: 'axios'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
