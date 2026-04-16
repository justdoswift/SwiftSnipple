import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const proxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('@heroui/react') || id.includes('@heroui/styles')) {
              return 'vendor-heroui';
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('react-router-dom') ||
              id.includes('/react-router/')
            ) {
              return 'vendor-react';
            }

            if (id.includes('/motion/') || id.includes('lucide-react')) {
              return 'vendor-motion-icons';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': proxyTarget,
        '/healthz': proxyTarget,
      },
    },
  };
});
