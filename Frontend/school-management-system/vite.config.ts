import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 20,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  rejectUnauthorized: false,
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  let apiTarget = (env.VITE_BACKEND_TARGET || 'http://127.0.0.1:5151').trim();
  if (apiTarget.includes('ngrok')) {
    apiTarget = 'http://127.0.0.1:5151';
  }
  const isHttps = apiTarget.startsWith('https');

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          agent: isHttps ? httpsAgent : httpAgent,
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
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          agent: isHttps ? httpsAgent : httpAgent,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          configure: (proxy, _options) => {
            proxy.on('error', (_err, _req, res) => {
              const httpRes = res as any;
              if (httpRes && !httpRes.headersSent && typeof httpRes.writeHead === 'function') {
                httpRes.writeHead(404, { 'Content-Type': 'text/plain' });
                httpRes.end('File not found or backend offline');
              }
            });
          }
        },
      },
    },
  };
});