import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from the current directory (including .env, .env.local, etc.)
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:5151';

  console.log(`🔌 Vite Proxy Target is configured to: ${proxyTarget}`);

  // Automatically inject ngrok skip header if target is an ngrok tunnel URL
  const isNgrok = proxyTarget.includes('ngrok');
  const headers = isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : undefined;

  return {
    plugins: [
      react()
    ],
    server: {
      host: '0.0.0.0',   // Expose to all network interfaces (allows other PCs on LAN to connect)
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          headers: headers,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy Error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Proxy Response:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  }
})
