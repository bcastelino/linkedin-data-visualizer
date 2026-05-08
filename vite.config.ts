import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages: when deployed at https://<user>.github.io/linkedin-data-visualizer/
// Set base via env: VITE_BASE=/linkedin-data-visualizer/
export default defineConfig(() => ({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
}));
