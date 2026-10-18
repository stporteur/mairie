import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // The dev API server reads the same root .env: PORT tells the proxy where it listens.
  const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '');
  const apiPort = env.PORT || '4000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      fs: { allow: ['..'] },
      proxy: {
        '/api': `http://localhost:${apiPort}`,
      },
    },
  };
});
