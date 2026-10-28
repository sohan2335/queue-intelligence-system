import { Router } from 'express';
import { QUERIES } from '../queries/index.js';
import { isMock } from '../db/pool.js';
import { loadSnapshot, runRawQuery } from '../db/store.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

// List all query definitions
router.get('/', (_req, res) => {
  res.json(QUERIES.map(({ id, title, description, sql }) => ({ id, title, description, sql })));
});

// Run one predefined query. In MySQL mode the exact SQL text is executed.
router.get('/:id', async (req, res, next) => {
  try {
    const query = QUERIES.find(q => q.id === Number(req.params.id));
    if (!query) return res.status(404).json({ error: 'Query not found' });
    const rows = isMock() ? emulate(query.id, await loadSnapshot()) : await runRawQuery(query.sql);
    res.json({ query, rows, source: isMock() ? 'mock' : 'mysql' });
  } catch (err) { next(err); }
});

/** JavaScript equivalents of the 10 queries, used only in mock mode. */
function emulate(id, db) {
  const { queue_entries: entries, visitors, counters, locations, predictions } = db;
  const C = cid => counters.find(c => c.COUNTER_ID === cid);
  const L = lid => locations.find(l => l.LOCATION_ID === lid);
  const V = vid => visitors.find(v => v.VISITOR_ID === vid);
  const P = eid => predictions.find(p => p.ENTRY_ID === eid);
  const group = fn => Object.entries(entries.reduce((a, e) => { a[e.COUNTER_ID] = fn(a[e.COUNTER_ID] || 0, e); return a; }, {}));

  switch (id) {
    case 1: return entries.filter(e => e.STATUS === 'Served');
    case 2: return counters.map(c => ({ COUNTER_ID: c.COUNTER_ID, COUNTER_NAME: c.COUNTER_NAME, SERVICE_TYPE: c.SERVICE_TYPE, LOCATION_ID: c.LOCATION_ID, LOCATION_NAME: L(c.LOCATION_ID)?.LOCATION_NAME }));
    case 3: return group(n => n + 1).map(([cid, n]) => ({ COUNTER_ID: +cid, TOTAL_VISITORS: n }));
    case 4: return [{ AVG_WAIT: entries.length ? entries.reduce((s, e) => s + e.WAIT_MINUTES, 0) / entries.length : null }];
    case 5: return entries.map(e => ({ FIRST_NAME: V(e.VISITOR_ID)?.FIRST_NAME, LAST_NAME: V(e.VISITOR_ID)?.LAST_NAME, COUNTER_NAME: C(e.COUNTER_ID)?.COUNTER_NAME, SERVICE_TYPE: C(e.COUNTER_ID)?.SERVICE_TYPE, STATUS: e.STATUS }));
    case 6: return entries.filter(e => e.WAIT_MINUTES > 15 && P(e.ENTRY_ID)).map(e => ({ FIRST_NAME: V(e.VISITOR_ID)?.FIRST_NAME, LAST_NAME: V(e.VISITOR_ID)?.LAST_NAME, WAIT_MINUTES: e.WAIT_MINUTES, BEST_SLOT: P(e.ENTRY_ID).BEST_SLOT }));
    case 7: return group((n, e) => n + e.WAIT_MINUTES).map(([cid, t]) => ({ COUNTER_ID: +cid, TOTAL_WAIT: t }));
    case 8: return counters.filter(c => L(c.LOCATION_ID)?.STATUS === 'Active').map(c => ({ COUNTER_ID: c.COUNTER_ID, COUNTER_NAME: c.COUNTER_NAME, LOCATION_NAME: L(c.LOCATION_ID).LOCATION_NAME, STATUS: 'Active' }));
    case 9: return entries.filter(e => L(C(e.COUNTER_ID)?.LOCATION_ID)?.LOCATION_NAME === 'Main Canteen').map(e => ({ FIRST_NAME: V(e.VISITOR_ID)?.FIRST_NAME, LAST_NAME: V(e.VISITOR_ID)?.LAST_NAME, COUNTER_NAME: C(e.COUNTER_ID)?.COUNTER_NAME, LOCATION_NAME: 'Main Canteen' }));
    case 10: return group((n, e) => n + e.WAIT_MINUTES).filter(([, t]) => t > 30).map(([cid, t]) => ({ COUNTER_ID: +cid, TOTAL_WAIT: t }));
    default: return [];
  }
}

export default router;
