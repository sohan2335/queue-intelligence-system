import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), '');
  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${serverEnv.PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
};
});
