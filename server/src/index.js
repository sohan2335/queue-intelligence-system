import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { initPool, closePool, isMock, executeQuery } from './db/pool.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import resourceRoutes from './routes/resources.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    if (!isMock()) await executeQuery('SELECT 1 FROM Queue_Entry LIMIT 1');
    res.json({ status: 'ok', mode: isMock() ? 'mock' : 'mysql', database: isMock() ? null : process.env.MYSQL_DATABASE, timestamp: new Date().toISOString() });
  } catch { res.status(503).json({ status: 'error', mode: 'mysql', error: 'Database unavailable' }); }
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api', resourceRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
if (existsSync(path.join(clientDist,'index.html'))) {
  app.use(express.static(clientDist));
  app.get('*', (_req,res) => res.sendFile(path.join(clientDist,'index.html')));
}
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

async function start() {
  try {
    if (!isMock() && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('Set JWT_SECRET to at least 32 random characters');
    await initPool();
  } catch (err) {
    console.error('❌ Could not connect to MySQL:', err.message);
    console.error('   Check MYSQL_HOST / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE in server/.env,');
    console.error('   or set USE_MOCK=true to run with the bundled seed data.');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Queue Intelligence API on http://localhost:${PORT} [${isMock() ? 'MOCK' : 'MYSQL'} mode]`);
  });
}

process.on('SIGINT', async () => { await closePool(); process.exit(0); });
start();
