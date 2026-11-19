import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { DiagnosticStore } from './store.js';

const backendRoot = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
const host = process.env.HOST ?? '127.0.0.1';
const staticDirectory = (process.argv.includes('--production') || process.env.NODE_ENV === 'production') ? resolve(backendRoot, process.env.FRONTEND_DIST ?? '../frontend/dist') : undefined;
if (staticDirectory && !existsSync(resolve(staticDirectory, 'index.html'))) {
  throw new Error('Frontend build missing. Run npm run build before npm start.');
}
const store = new DiagnosticStore(resolve(backendRoot, process.env.DATABASE_PATH ?? 'data/voltguard.sqlite'));
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000').split(',').map(value => value.trim());
const server = createApp(store, { staticDirectory, allowedOrigins }).listen(port, host, () => {
  console.log(`Voltguard API${staticDirectory ? ' + frontend' : ''}: http://${host}:${port}`);
});
server.on('error', error => {
  console.error('Could not start server:', error.message);
  store.close();
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => { store.close(); process.exit(0); });
    server.closeIdleConnections();
    setTimeout(() => process.exit(1), 5000).unref();
  });
}
