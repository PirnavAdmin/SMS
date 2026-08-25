import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'https://skimpily-chafe-harmless.ngrok-free.dev';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.warn('[vite proxy error] Target backend connection failed:', err.message);
              const httpRes = res as any;
              if (httpRes && !httpRes.headersSent && typeof httpRes.writeHead === 'function') {
                httpRes.writeHead(503, { 'Content-Type': 'application/json' });
                httpRes.end(JSON.stringify({ error: 'Backend proxy offline or TLS disconnected', details: err.message }));
              }
            });
          }
        },
      },
    },
  };
});