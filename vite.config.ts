import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function kiloGatewayProxyPlugin(): Plugin {
  return {
    name: 'kilo-gateway-proxy',
    configureServer(server) {
      server.middlewares.use('/api/kilo', async (req, res, next) => {
        try {
          const subPath = req.url || '';
          const targetUrl = `https://ai-gateway.kilo.ai/api/v1${subPath}`;

          let body: string | undefined = undefined;
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            body = Buffer.concat(chunks).toString('utf-8');
          }

          const response = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'User-Agent': 'Chakki-Platform-Proxy/2.0',
            },
            body,
          });

          res.statusCode = response.status;
          response.headers.forEach((val, key) => {
            if (key !== 'content-encoding' && key !== 'transfer-encoding') {
              res.setHeader(key, val);
            }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

          const responseText = await response.text();
          res.end(responseText);
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Kilo Gateway proxy error: ${err.message}` }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), kiloGatewayProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
