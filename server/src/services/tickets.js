import { isMock, withTransaction } from '../db/pool.js';
import { loadSnapshot, createEntry, updateEntryStatus } from '../db/store.js';
import * as svc from './queue.js';

/** Validate, insert, and return the fully-enriched new ticket. */
export async function issueTicket(input) {
  return mutate(async exec => {
  if (exec) await exec('SELECT Counter_ID FROM Counter WHERE Counter_ID=:cid FOR UPDATE', { cid: Number(input.counter_id) || 0 });
  const db = await loadSnapshot(exec);
  const t = svc.prepareTicket(db, input);
  const entryId = await createEntry(t, exec);
  const fresh = await loadSnapshot(exec);
  const entry = svc.findEntry(fresh, entryId);
  return { entry, prediction: entry.prediction };
  });
}

/**
 * Change a ticket's status. Calling a new ticket automatically completes
 * whoever was being called at that counter, so the board always shows one
 * "Now Serving" token per counter.
 */
export async function changeStatus(entryId, status, ownerId = null) {
  return mutate(async exec => {
  if (exec) {
    const { rows } = await exec('SELECT Counter_ID FROM Queue_Entry WHERE Entry_ID=:eid', { eid: Number(entryId) || 0 });
    if (rows.length) await exec('SELECT Counter_ID FROM Counter WHERE Counter_ID=:cid FOR UPDATE', { cid: rows[0].COUNTER_ID });
  }
  if (!svc.STATUSES.includes(status)) {
    throw new svc.ValidationError(`Status must be one of ${svc.STATUSES.join(', ')}`);
  }
  const db = await loadSnapshot(exec);
  const entry = db.queue_entries.find(e => e.ENTRY_ID === Number(entryId));
  if (!entry) { const e = new Error('Ticket not found'); e.status = 404; throw e; }

  if (ownerId != null && (entry.VISITOR_ID !== ownerId || entry.STATUS !== 'Waiting' || status !== 'Left')) {
    throw new svc.ValidationError('Only your own waiting tickets can be cancelled');
  }
  const transitions = { Waiting: ['Calling','Left'], Calling: ['Served','Left'], Served: [], Left: [] };
  if (!transitions[entry.STATUS]?.includes(status)) throw new svc.ValidationError('Invalid transition from '+entry.STATUS+' to '+status);
  if (entry.ENTRY_DATE !== svc.todayStr()) throw new svc.ValidationError('Only today’s tickets can be changed');
  if (status === 'Calling') {
    const current = db.queue_entries.filter(
      e => e.COUNTER_ID === entry.COUNTER_ID && e.STATUS === 'Calling' && e.ENTRY_ID !== entry.ENTRY_ID
    );
    for (const c of current) await updateEntryStatus(c.ENTRY_ID, 'Served', svc.computeServedWait(c), exec);
  }
  const wait = status === 'Served' ? svc.computeServedWait(entry) : null;
  await updateEntryStatus(entry.ENTRY_ID, status, wait, exec);
  return svc.findEntry(await loadSnapshot(exec), entry.ENTRY_ID);
  });
}

// Counter row locks serialize validation and writes across server processes.
// Mock mode uses a promise queue because it has no database transactions.
let pending = Promise.resolve();
function mutate(fn) {
  if (!isMock()) return withTransaction(fn);
  const next = pending.then(() => fn(undefined));
  pending = next.catch(() => {});
  return next;
}
