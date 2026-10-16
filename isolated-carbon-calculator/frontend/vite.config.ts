import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Isolated Carbon Calculator Vite Configuration
// Runs on port 5175 to avoid collision with main application (port 5173).
// In development, proxies /api calls to isolated backend on http://127.0.0.1:8085.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
    },
  },
});
