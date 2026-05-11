import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [tailwindcss(), solid()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
