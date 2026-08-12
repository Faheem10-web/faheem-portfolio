import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawSiteUrl = env.VITE_SITE_URL || 'https://faheem-av.vercel.app';
  const siteUrl = rawSiteUrl.replace(/\/+$/, '');
  const isProd = mode === 'production';

  return {
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_SITE_URL%/g, siteUrl);
        },
      },
    ],
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      cssMinify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-vendor';
            }
            if (id.includes('node_modules/three') || id.includes('node_modules/ogl')) {
              return 'three-vendor';
            }
            if (id.includes('node_modules/react-icons') || id.includes('node_modules/lucide-react')) {
              return 'icons-vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});

