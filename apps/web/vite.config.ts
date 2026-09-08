import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()], worker: { format: 'es' }, server: { strictPort: true },
  build: { rollupOptions: { input: Object.fromEntries(['index.html', 'guide/index.html', 'docs/index.html'].map(path => [path, fileURLToPath(new URL(path, import.meta.url))])) } },
});
