import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',  // ← Add this line
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});