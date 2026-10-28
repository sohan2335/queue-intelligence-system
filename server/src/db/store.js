/**
 * Data-access layer.
 *
 * Every route reads a "snapshot" of the five tables and writes through the
 * functions below. In MySQL mode these run real SQL (bind variables only);
 * in mock mode they operate on the in-memory seed data. Because both modes
 * produce the same row shape (UPPERCASE column names, dates as YYYY-MM-DD),
 * the business logic and the frontend never need to know which one is active.
 */
import { createRequire } from 'module';
import { isMock, executeQuery, withTransaction } from './pool.js';

const require = createRequire(import.meta.url);
// Deep-clone so in-memory changes never touch the cached JSON module.
const memory = JSON.parse(JSON.stringify(require('../mock/data.json')));

// ─── Reads ───────────────────────────────────────────────────────────────────

const SNAPSHOT_SQL = {
  locations: `SELECT Location_ID, Location_Name, Location_Type, Status, Peak_Hours
              FROM Location ORDER BY Location_ID`,
  counters: `SELECT Counter_ID, Counter_Name, Service_Type, Open_Time, Close_Time,
                    Queue_Limit, Location_ID
             FROM Counter ORDER BY Counter_ID`,
  visitors: `SELECT Visitor_ID, First_Name, Last_Name, Department, ID_Number,
                    Visitor_Type, Entry_ID
             FROM Visitor ORDER BY Visitor_ID`,
  queue_entries: `SELECT Entry_ID, Visitor_ID, Counter_ID,
                         Entry_Date AS ENTRY_DATE,
                         Arrival_Time, Status, Wait_Minutes
                  FROM Queue_Entry ORDER BY Entry_ID`,
  predictions: `SELECT Prediction_ID, Entry_ID,
                       Prediction_Date AS PREDICTION_DATE,
                       Predicted_Wait, Best_Slot
                FROM Prediction ORDER BY Prediction_ID`,
};

/** Load all five tables. */
export async function loadSnapshot(exec = executeQuery) {
  if (isMock()) return memory;
  const entries = await Promise.all(
    Object.entries(SNAPSHOT_SQL).map(async ([key, sql]) => [key, (await exec(sql)).rows])
  );
  return Object.fromEntries(entries);
}

/** Run one of the predefined read-only explorer queries (static SQL, no user input). */
export async function runRawQuery(sql) {
  const result = await executeQuery(sql);
  return result.rows;
}

// ─── Writes ──────────────────────────────────────────────────────────────────

/**
 * Insert a Queue_Entry + its Prediction and point Visitor.Entry_ID at it
 * (resolving the circular Visitor <-> Queue_Entry reference).
 * Returns the new Entry_ID.
 */
export async function createEntry({ visitorId, counterId, entryDate, arrivalTime, predictedWait, bestSlot }, transactionExec) {
  if (isMock()) {
    const entryId = Math.max(2000, ...memory.queue_entries.map(e => e.ENTRY_ID)) + 1;
    memory.queue_entries.push({
      ENTRY_ID: entryId, VISITOR_ID: visitorId, COUNTER_ID: counterId,
      ENTRY_DATE: entryDate, ARRIVAL_TIME: arrivalTime, STATUS: 'Waiting', WAIT_MINUTES: 0,
    });
    const predictionId = Math.max(0, ...memory.predictions.map(p => p.PREDICTION_ID)) + 1;
    memory.predictions.push({
      PREDICTION_ID: predictionId, ENTRY_ID: entryId, PREDICTION_DATE: entryDate,
      PREDICTED_WAIT: predictedWait, BEST_SLOT: bestSlot,
    });
    const v = memory.visitors.find(x => x.VISITOR_ID === visitorId);
    if (v) v.ENTRY_ID = entryId;
    return entryId;
  }

  const insert = async exec => {
    const { insertId: entryId } = await exec(
      `INSERT INTO Queue_Entry (Visitor_ID, Counter_ID, Entry_Date, Arrival_Time, Status, Wait_Minutes)
       VALUES (:vid, :cid, :edate, :atime, 'Waiting', 0)`,
      { vid: visitorId, cid: counterId, edate: entryDate, atime: arrivalTime }
    );
    await exec(
      `INSERT INTO Prediction (Entry_ID, Prediction_Date, Predicted_Wait, Best_Slot)
       VALUES (:eid, :pdate, :pwait, :slot)`,
      { eid: entryId, pdate: entryDate, pwait: predictedWait, slot: bestSlot }
    );
    await exec('UPDATE Visitor SET Entry_ID = :eid WHERE Visitor_ID = :vid', { eid: entryId, vid: visitorId });
    return entryId;
  };
  return transactionExec ? insert(transactionExec) : withTransaction(insert);
}

/** Change an entry's status (and optionally its recorded wait). */
export async function updateEntryStatus(entryId, status, waitMinutes = null, exec = executeQuery) {
  if (isMock()) {
    const e = memory.queue_entries.find(x => x.ENTRY_ID === entryId);
    if (!e) return false;
    e.STATUS = status;
    if (waitMinutes != null) e.WAIT_MINUTES = waitMinutes;
    return true;
  }
  const result = await exec(
    `UPDATE Queue_Entry
        SET Status = :status,
            Wait_Minutes = COALESCE(:wait, Wait_Minutes)
      WHERE Entry_ID = :eid`,
    { status, wait: waitMinutes, eid: entryId }
  );
  return result.rowsAffected > 0;
}
