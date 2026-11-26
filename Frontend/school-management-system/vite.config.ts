import { defineConfig, loadEnv, type ProxyOptions, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';
import net from 'net';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

// Prefer IPv4 first so Node's Happy Eyeballs does not stall on unavailable IPv6 routes to trycloudflare.com.
dns.setDefaultResultOrder('ipv4first');

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 20,
});

// Disable keepAlive on remote HTTPS tunnels so stale pooled TLS sockets do not cause ECONNRESET / socket hang up.
const httpsAgent = new https.Agent({
  keepAlive: false,
  maxSockets: 100,
  rejectUnauthorized: false,
});

const isPortReachable = (host: string, port: number, timeoutMs = 300): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const finish = (reachable: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredTarget = (env.VITE_BACKEND_TARGET || env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const forceRemote = env.VITE_FORCE_REMOTE_PROXY === 'true';

  const pickLocalTarget = async (): Promise<string> => {
    if (await isPortReachable('127.0.0.1', 5151)) {
      return 'http://127.0.0.1:5151';
    }
    if (await isPortReachable('::1', 5151)) {
      return 'http://[::1]:5151';
    }
    return '';
  };

  let cachedTarget = '';
  let lastCheckedAt = 0;
  let lastProxyWarnAt = 0;

  const resolveProxyTarget = async (): Promise<string> => {
    if (command === 'serve' && !forceRemote) {
      const now = Date.now();
      if (!cachedTarget || now - lastCheckedAt > 1500) {
        const reachable = await pickLocalTarget();
        cachedTarget = reachable || 'http://127.0.0.1:5151';
        lastCheckedAt = now;
      }
      return cachedTarget;
    }
    return configuredTarget || 'http://127.0.0.1:5151';
  };

  const initialTarget = await resolveProxyTarget();
  const isHttps = forceRemote && initialTarget.startsWith('https');

  const sharedProxyOptions: ProxyOptions = {
    target: initialTarget,
    changeOrigin: true,
    secure: false,
    agent: isHttps ? httpsAgent : httpAgent,
    timeout: 60000,
    proxyTimeout: 60000,
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  };

  const proxy: Record<string, ProxyOptions> = {
    '/api': {
      ...sharedProxyOptions,
      configure: (proxyServer, options) => {
        if (command === 'serve' && !forceRemote) {
          const timer = setInterval(() => {
            void resolveProxyTarget().then((nextTarget) => {
              options.target = nextTarget;
            });
          }, 2000);
          timer.unref();
        }
        proxyServer.on('error', (err, _req, res) => {
          void resolveProxyTarget().then((nextTarget) => {
            options.target = nextTarget;
          });
          const now = Date.now();
          if (now - lastProxyWarnAt > 5000) {
            lastProxyWarnAt = now;
            console.warn(
              `[vite proxy] Local ASP.NET Core backend is unavailable (${err.message}). Wait for "dotnet run" on :5151 or run .\\start-dev.ps1.`
            );
          }
          const httpRes = res as http.ServerResponse | undefined;
          if (httpRes && !httpRes.headersSent && typeof httpRes.writeHead === 'function') {
            httpRes.writeHead(503, {
              'Content-Type': 'application/json',
              'Retry-After': '2',
            });
            httpRes.end(JSON.stringify({ error: 'Backend server unavailable', details: err.message }));
          }
        });
      },
    },
    '/uploads': {
      ...sharedProxyOptions,
      bypass: (req) => {
        try {
          const urlPath = (req.url || '').split('?')[0];
          const localPath = path.resolve(import.meta.dirname, 'public', urlPath.replace(/^\/+/, ''));
          if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            return req.url; // Bypasses proxy and lets Vite serve directly from public/
          }
        } catch { }
        return undefined;
      },
      configure: (proxyServer) => {
        proxyServer.on('error', (_err, req, res) => {
          const httpRes = res as http.ServerResponse | undefined;
          if (httpRes && !httpRes.headersSent && typeof httpRes.writeHead === 'function') {
            const reqUrl = ((req && req.url) || '').toLowerCase();
            if (reqUrl.includes('.webp') || reqUrl.includes('.png') || reqUrl.includes('.jpg') || reqUrl.includes('.jpeg') || reqUrl.includes('.svg')) {
              const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="100%" height="100%" fill="#e2e8f0" rx="64"/><circle cx="64" cy="48" r="24" fill="#94a3b8"/><path d="M24 108c0-22.091 17.909-40 40-40s40 17.909 40 40" fill="#94a3b8"/></svg>`;
              httpRes.writeHead(200, { 'Content-Type': 'image/svg+xml' });
              httpRes.end(fallbackSvg);
            } else {
              httpRes.writeHead(404, { 'Content-Type': 'text/plain' });
              httpRes.end('File not found or backend offline');
            }
          }
        });
      },
    },
  };

  return {
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: true,
      proxy,
    },
  };
});
