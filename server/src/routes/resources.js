import { Router } from 'express';
import { loadSnapshot } from '../db/store.js';
import * as svc from '../services/queue.js';
import { issueTicket, changeStatus } from '../services/tickets.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

/**
 * Small read-only resources. Counters, locations and the token board are
 * visible to every signed-in user (visitors need them to pick a counter);
 * the rest is admin-only.
 */
const router = Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const send = fn => wrap(async (req, res) => res.json(fn(await loadSnapshot(), req)));

// ── Shared (any signed-in user) ──────────────────────────────────────────────
router.get('/counters',  requireAuth, send(db => svc.getCounters(db)));
router.get('/locations', requireAuth, send((db, req) => svc.getLocations(db, req.query)));
router.get('/tokens/board', requireAuth, send((db, req) =>
  svc.getCounterBoard(db, { hideNames: req.user.role !== 'admin' })   // visitors don't see other people's names
));

// ── Admin only ───────────────────────────────────────────────────────────────
router.get('/visitors',      requireAdmin, send((db, req) => svc.getVisitors(db, req.query)));
router.get('/queue-entries', requireAdmin, send((db, req) => svc.getQueueEntries(db, req.query)));
router.get('/predictions',   requireAdmin, send((db, req) => svc.getPredictions(db, req.query)));
router.get('/stats/dashboard', requireAdmin, send(db => svc.getDashboardStats(db)));

router.get('/tokens/lookup/:query', requireAuth, wrap(async (req, res) => {
  const t = svc.lookupTicket(await loadSnapshot(), req.params.query, req.user.role === 'admin' ? null : req.user.visitorId);
  if (!t) return res.status(404).json({ error: 'Token or ticket not found' });
  res.json(t);
}));

// Admin issues a ticket on behalf of any visitor (kiosk / Join Queue form).
const adminIssue = wrap(async (req, res) => {
  const { visitor_id, counter_id, arrival_time } = req.body || {};
  if (!visitor_id || !counter_id) return res.status(400).json({ error: 'visitor_id and counter_id are required' });
  res.status(201).json(await issueTicket({ visitor_id, counter_id, arrival_time }));
});
router.post('/queue-entries',   requireAdmin, adminIssue);
router.post('/tokens/dispense', requireAdmin, adminIssue);

const adminStatus = wrap(async (req, res) => res.json(await changeStatus(req.params.id, req.body?.status)));
router.patch('/queue-entries/:id/status', requireAdmin, adminStatus);
router.patch('/tokens/:id/status',        requireAdmin, adminStatus);

export default router;
