import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/api': {
        target: 'https://showroom.eis24.me',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/c300/api'),
      },
    },
  },
});
