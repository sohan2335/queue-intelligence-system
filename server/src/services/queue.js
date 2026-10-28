/**
 * Business logic. Every function takes a `db` snapshot
 * ({ locations, counters, visitors, queue_entries, predictions }) and is
 * pure, so the same code serves Oracle and mock mode.
 */

export const STATUSES = ['Waiting', 'Calling', 'Served', 'Left'];

// ─── Time helpers ─────────────────────────────────────────────────────────────

const campusParts = () => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: process.env.CAMPUS_TIMEZONE || 'Asia/Kolkata', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).formatToParts(new Date()).map(p=>[p.type,p.value]));
export const todayStr = () => { const p=campusParts(); return p.year+'-'+p.month+'-'+p.day; };
export const nowHHMM = () => { const p=campusParts(); return p.hour+':'+p.minute; };
const toMin = hhmm => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return h * 60 + m;
};
const inRange = (t, range) => {
  if (!range || !range.includes('-')) return false;
  const [a, b] = range.split('-');
  return toMin(t) >= toMin(a) && toMin(t) <= toMin(b);
};

// ─── Lookups ──────────────────────────────────────────────────────────────────

const counterOf    = (db, id)  => db.counters.find(c => c.COUNTER_ID === Number(id));
const locationOf   = (db, id)  => db.locations.find(l => l.LOCATION_ID === Number(id));
const visitorOf    = (db, id)  => db.visitors.find(v => v.VISITOR_ID === Number(id));
const predictionOf = (db, eid) => db.predictions.find(p => p.ENTRY_ID === eid);

// ─── Tokens ───────────────────────────────────────────────────────────────────

const CODES = { 101: 'BIL', 102: 'XRX', 103: 'SNK', 104: 'LAB', 105: 'FEE' };
export function counterCode(db, counterId) {
  if (CODES[counterId]) return CODES[counterId];
  const name = counterOf(db, counterId)?.COUNTER_NAME || 'C';
  return name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || `C${counterId}`;
}
export const tokenNumber = (db, e) =>
  `${counterCode(db, e.COUNTER_ID)}-${String(e.ENTRY_ID).padStart(3, '0')}`;

function waitingAt(db, counterId) {
  return db.queue_entries
    .filter(e => e.COUNTER_ID === Number(counterId) && e.ENTRY_DATE === todayStr() && e.STATUS === 'Waiting')
    .sort((a, b) => a.ENTRY_ID - b.ENTRY_ID);
}

// ─── Prediction ("intelligence") ──────────────────────────────────────────────

/** Historical average wait at a counter (completed entries only). */
function historicalAvg(db, counterId) {
  const done = db.queue_entries.filter(
    e => e.COUNTER_ID === Number(counterId) && (e.STATUS === 'Served' || e.STATUS === 'Left')
  );
  if (!done.length) return 10;
  return done.reduce((s, e) => s + (e.WAIT_MINUTES || 0), 0) / done.length;
}

/**
 * Predict wait for someone arriving at `arrivalTime`:
 *   historical average × 1.3 during the location's peak hours
 *   + 1.5 min for each person already waiting.
 * Best slot = the slot most often recommended for this counter historically.
 */
export function predict(db, counterId, arrivalTime = nowHHMM()) {
  const counter  = counterOf(db, counterId);
  const location = counter && locationOf(db, counter.LOCATION_ID);
  const peak     = inRange(arrivalTime, location?.PEAK_HOURS);
  const ahead    = waitingAt(db, counterId).length;
  const predictedWait = Math.max(1, Math.round(historicalAvg(db, counterId) * (peak ? 1.3 : 1) + ahead * 1.5));

  const slotCounts = {};
  db.queue_entries
    .filter(e => e.COUNTER_ID === Number(counterId))
    .forEach(e => {
      const slot = predictionOf(db, e.ENTRY_ID)?.BEST_SLOT;
      if (slot) slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    });
  let bestSlot = Object.entries(slotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '15:30-16:30';

  if (counter) {
    const [start,end] = bestSlot.split('-');
    const clippedStart = start < counter.OPEN_TIME ? counter.OPEN_TIME : start;
    const clippedEnd = end > counter.CLOSE_TIME ? counter.CLOSE_TIME : end;
    bestSlot = clippedStart < clippedEnd ? clippedStart+'-'+clippedEnd : counter.OPEN_TIME+'-'+counter.CLOSE_TIME;
  }
  return { predictedWait, bestSlot, isPeak: peak, peopleWaiting: ahead };
}

// ─── Enrichment ───────────────────────────────────────────────────────────────

export function enrichEntry(db, e) {
  const counter    = counterOf(db, e.COUNTER_ID);
  const location   = counter ? locationOf(db, counter.LOCATION_ID) : null;
  const prediction = predictionOf(db, e.ENTRY_ID) || null;
  let position = null;
  if (e.STATUS === 'Waiting') {
    position = waitingAt(db, e.COUNTER_ID).findIndex(w => w.ENTRY_ID === e.ENTRY_ID) + 1 || null;
  }
  const peopleAhead = position ? position - 1 : 0;
  // Estimated wait = the stored Prediction.Predicted_Wait (fallback: counter's historical average).
  const estimatedWait = e.STATUS === 'Waiting'
    ? Math.max(1, Math.round(prediction?.PREDICTED_WAIT ?? historicalAvg(db, e.COUNTER_ID)))
    : e.STATUS === 'Calling' ? 0 : null;

  return {
    ...e,
    TOKEN_NUMBER: tokenNumber(db, e),
    TOKEN_CODE: counterCode(db, e.COUNTER_ID),
    QUEUE_POSITION: position,
    PEOPLE_AHEAD: peopleAhead,
    IS_ACTIVE: e.ENTRY_DATE === todayStr() && ['Waiting','Calling'].includes(e.STATUS),
    ESTIMATED_WAIT: estimatedWait,
    counter, location, prediction,
    visitor: visitorOf(db, e.VISITOR_ID) || null,
  };
}

// ─── Read models ──────────────────────────────────────────────────────────────

export function getLocations(db, { activeOnly } = {}) {
  return db.locations
    .filter(l => !(activeOnly === 'true' || activeOnly === true) || l.STATUS === 'Active')
    .map(l => ({ ...l, counters: db.counters.filter(c => c.LOCATION_ID === l.LOCATION_ID) }));
}

export function getCounters(db) {
  const now = nowHHMM();
  return db.counters.map(c => {
    const p = predict(db, c.COUNTER_ID, now);
    return {
      ...c,
      code: counterCode(db, c.COUNTER_ID),
      location: locationOf(db, c.LOCATION_ID),
      currentWaiting: p.peopleWaiting,
      estimatedWait: p.predictedWait,
      bestSlot: p.bestSlot,
      isPeakNow: p.isPeak,
      isOpenNow: locationOf(db, c.LOCATION_ID)?.STATUS === 'Active' && now >= c.OPEN_TIME && now <= c.CLOSE_TIME,
    };
  });
}

export function getVisitors(db, { department, type, location } = {}) {
  return db.visitors
    .filter(v => (!department || v.DEPARTMENT === department) && (!type || v.VISITOR_TYPE === type))
    .map(v => {
      let entries = db.queue_entries.filter(q => q.VISITOR_ID === v.VISITOR_ID).map(q => enrichEntry(db, q));
      if (location) {
        entries = entries.filter(e => e.location?.LOCATION_NAME === location);
        if (!entries.length) return null;
      }
      return { ...v, entries };
    })
    .filter(Boolean);
}

export function getQueueEntries(db, { status, counter_id, date, location_id, search, visitor_id } = {}) {
  let rows = db.queue_entries.map(q => enrichEntry(db, q));
  if (status)      rows = rows.filter(e => e.STATUS === status);
  if (counter_id)  rows = rows.filter(e => e.COUNTER_ID === Number(counter_id));
  if (location_id) rows = rows.filter(e => e.location?.LOCATION_ID === Number(location_id));
  if (visitor_id)  rows = rows.filter(e => e.VISITOR_ID === Number(visitor_id));
  if (date)        rows = rows.filter(e => e.ENTRY_DATE === date);
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter(e =>
      e.TOKEN_NUMBER.toLowerCase().includes(q) ||
      e.visitor?.FIRST_NAME?.toLowerCase().includes(q) ||
      e.visitor?.LAST_NAME?.toLowerCase().includes(q) ||
      e.visitor?.ID_NUMBER?.toLowerCase().includes(q)
    );
  }
  return rows;
}

export function findEntry(db, entryId) {
  const e = db.queue_entries.find(x => x.ENTRY_ID === Number(entryId));
  return e ? enrichEntry(db, e) : null;
}

export function lookupTicket(db, query, visitorId = null) {
  const q = String(query).trim().toLowerCase();
  return getQueueEntries(db, visitorId == null ? {} : { visitor_id: visitorId }).sort((a,b)=>b.ENTRY_ID-a.ENTRY_ID).find(e =>
    e.TOKEN_NUMBER.toLowerCase() === q ||
    String(e.ENTRY_ID) === q ||
    e.visitor?.ID_NUMBER?.toLowerCase() === q
  ) || null;
}

export function getPredictions(db, { counter_id, location_id } = {}) {
  return db.predictions
    .map(p => {
      const entry    = db.queue_entries.find(q => q.ENTRY_ID === p.ENTRY_ID) || null;
      const counter  = entry ? counterOf(db, entry.COUNTER_ID) : null;
      const location = counter ? locationOf(db, counter.LOCATION_ID) : null;
      const visitor  = entry ? visitorOf(db, entry.VISITOR_ID) : null;
      return { ...p, entry, counter, location, visitor };
    })
    .filter(p =>
      (!counter_id  || p.counter?.COUNTER_ID   === Number(counter_id)) &&
      (!location_id || p.location?.LOCATION_ID === Number(location_id))
    );
}

export function getCounterBoard(db, { hideNames = false } = {}) {
  const slim = e => {
    if (!e) return null;
    if (hideNames) return { ENTRY_ID: e.ENTRY_ID, COUNTER_ID: e.COUNTER_ID, STATUS: e.STATUS, TOKEN_NUMBER: tokenNumber(db,e) };
    return enrichEntry(db,e);
  };
  return db.counters.map(counter => {
    const entries = db.queue_entries.filter(e => e.COUNTER_ID === counter.COUNTER_ID && e.ENTRY_DATE === todayStr());
    const waiting = waitingAt(db, counter.COUNTER_ID);
    const served  = entries.filter(e => e.STATUS === 'Served').sort((a, b) => b.ENTRY_ID - a.ENTRY_ID);
    const calling = entries.find(e => e.STATUS === 'Calling');
    return {
      counter: { ...counter, code: counterCode(db, counter.COUNTER_ID), location: locationOf(db, counter.LOCATION_ID) },
      nowServing: slim(calling),
      isCalling: !!calling,
      nextInLine: slim(waiting[0]),
      waitingCount: waiting.length,
      waitingTokens: waiting.map(slim),
      recentServed: served.slice(0, 4).map(slim),
    };
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getDashboardStats(db) {
  const entries = db.queue_entries;
  const count = s => entries.filter(e => e.STATUS === s).length;
  const avg = entries.length ? entries.reduce((s, e) => s + (e.WAIT_MINUTES || 0), 0) / entries.length : 0;

  const perCounter = db.counters.map(c => {
    const list = entries.filter(e => e.COUNTER_ID === c.COUNTER_ID);
    return {
      COUNTER_ID: c.COUNTER_ID, COUNTER_NAME: c.COUNTER_NAME,
      TOTAL_VISITORS: list.length,
      TOTAL_WAIT: list.reduce((s, e) => s + (e.WAIT_MINUTES || 0), 0),
    };
  }).filter(c => c.TOTAL_VISITORS > 0);

  const busiest = perCounter.length
    ? perCounter.reduce((a, b) => (b.TOTAL_VISITORS > a.TOTAL_VISITORS ? b : a))
    : null;

  const breakdown = STATUSES.map(s => ({ STATUS: s, COUNT: count(s) })).filter(s => s.COUNT > 0 || s.STATUS !== 'Calling');

  return {
    total_entries: entries.length,
    avg_wait: +avg.toFixed(2),
    waiting_count: entries.filter(e => e.ENTRY_DATE === todayStr() && ['Waiting','Calling'].includes(e.STATUS)).length,
    served_count: entries.filter(e => e.ENTRY_DATE === todayStr() && e.STATUS === 'Served').length,
    left_count: count('Left'),
    visitors_per_counter: perCounter.map(({ COUNTER_ID, COUNTER_NAME, TOTAL_VISITORS }) => ({ COUNTER_ID, COUNTER_NAME, TOTAL_VISITORS })),
    total_wait_per_counter: perCounter.map(({ COUNTER_ID, COUNTER_NAME, TOTAL_WAIT }) => ({ COUNTER_ID, COUNTER_NAME, TOTAL_WAIT })),
    long_wait_counters: perCounter.filter(c => c.TOTAL_WAIT > 30).map(({ COUNTER_ID, COUNTER_NAME, TOTAL_WAIT }) => ({ COUNTER_ID, COUNTER_NAME, TOTAL_WAIT })),
    status_breakdown: breakdown,
    busiest_counter: busiest && {
      ...busiest,
      counter: counterOf(db, busiest.COUNTER_ID),
      location: locationOf(db, counterOf(db, busiest.COUNTER_ID)?.LOCATION_ID),
    },
  };
}

// ─── Ticket issuing (validation) ──────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(msg) { super(msg); this.status = 400; }
}

/**
 * Validate a ticket request and compute its prediction.
 * Rules: visitor & counter exist, location Active, counter open at the
 * arrival time, Queue_Limit not reached, and the visitor has no other
 * active ticket at the same counter.
 */
export function prepareTicket(db, { visitor_id, counter_id, arrival_time }) {
  const visitor = visitorOf(db, visitor_id);
  if (!visitor) throw new ValidationError('Visitor not found');
  const counter = counterOf(db, counter_id);
  if (!counter) throw new ValidationError('Counter not found');
  const location = locationOf(db, counter.LOCATION_ID);
  if (!location || location.STATUS !== 'Active') {
    throw new ValidationError(`${location?.LOCATION_NAME || 'This location'} is currently inactive`);
  }

  let time = arrival_time || nowHHMM();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ValidationError('Arrival time must be HH:MM');
  if (time < counter.OPEN_TIME || time > counter.CLOSE_TIME) {
    throw new ValidationError(`${counter.COUNTER_NAME} is open ${counter.OPEN_TIME}–${counter.CLOSE_TIME} (requested ${time})`);
  }

  const waiting = waitingAt(db, counter.COUNTER_ID);
  if (waiting.length >= counter.QUEUE_LIMIT) {
    throw new ValidationError(`Queue limit (${counter.QUEUE_LIMIT}) reached for ${counter.COUNTER_NAME}`);
  }
  const duplicate = db.queue_entries.find(e =>
    e.VISITOR_ID === visitor.VISITOR_ID && e.COUNTER_ID === counter.COUNTER_ID && e.ENTRY_DATE === todayStr() &&
    (e.STATUS === 'Waiting' || e.STATUS === 'Calling')
  );
  if (duplicate) {
    throw new ValidationError(`${visitor.FIRST_NAME} already holds active ticket ${tokenNumber(db, duplicate)} at this counter`);
  }

  const { predictedWait, bestSlot } = predict(db, counter.COUNTER_ID, time);
  return {
    visitorId: visitor.VISITOR_ID,
    counterId: counter.COUNTER_ID,
    entryDate: todayStr(),
    arrivalTime: time,
    predictedWait,
    bestSlot,
  };
}

/** Actual wait in minutes when an entry is marked Served (today's entries only). */
export function computeServedWait(entry) {
  if (!entry || entry.ENTRY_DATE !== todayStr()) return null;
  return Math.max(0, toMin(nowHHMM()) - toMin(entry.ARRIVAL_TIME));
}
