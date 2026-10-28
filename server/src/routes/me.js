import { Router } from 'express';
import { loadSnapshot } from '../db/store.js';
import * as svc from '../services/queue.js';
import { issueTicket, changeStatus } from '../services/tickets.js';
import { requireUser } from '../middleware/auth.js';

/** Endpoints for a signed-in visitor. They can only ever touch their own tickets. */
const router = Router();
router.use(requireUser);
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// GET /api/me/tickets – my tickets, newest first, with live position & wait
router.get('/tickets', wrap(async (req, res) => {
  const db = await loadSnapshot();
  const mine = svc.getQueueEntries(db, { visitor_id: req.user.visitorId })
    .sort((a, b) => b.ENTRY_ID - a.ENTRY_ID);
  res.json(mine);
}));

// POST /api/me/tickets – take a ticket for myself
router.post('/tickets', wrap(async (req, res) => {
  const { counter_id, arrival_time } = req.body || {};
  if (!counter_id) return res.status(400).json({ error: 'counter_id is required' });
  res.status(201).json(await issueTicket({ visitor_id: req.user.visitorId, counter_id, arrival_time }));
}));

// PATCH /api/me/tickets/:id/cancel – leave the queue
router.patch('/tickets/:id/cancel', wrap(async (req, res) => {
  const db = await loadSnapshot();
  const t = db.queue_entries.find(e => e.ENTRY_ID === Number(req.params.id));
  if (!t || t.VISITOR_ID !== req.user.visitorId) return res.status(404).json({ error: 'Ticket not found' });
  if (t.STATUS !== 'Waiting') return res.status(400).json({ error: 'Only waiting tickets can be cancelled' });
  res.json(await changeStatus(t.ENTRY_ID, 'Left', req.user.visitorId));
}));

export default router;
