import mysql from 'mysql2/promise';
let pool;
export const isMock = () => process.env.USE_MOCK === 'true';
export const connectionOptions = () => ({
  host: process.env.MYSQL_HOST || '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'queue_intelligence',
  namedPlaceholders: true, dateStrings: true, decimalNumbers: true, connectionLimit: 10,
});
const normalize = rows => rows.map(row => Object.fromEntries(Object.entries(row).map(([k,v]) => [k.toUpperCase(),v])));
const resultOf = rows => Array.isArray(rows) ? { rows: normalize(rows) }
  : { rowsAffected: rows.affectedRows, insertId: rows.insertId };
export async function initPool() {
  if (isMock()) return;
  if (!process.env.MYSQL_USER) throw new Error('MYSQL_USER must be configured in server/.env');
  pool = mysql.createPool(connectionOptions());
  await executeQuery('SELECT COUNT(*) FROM Queue_Entry');
}
export async function closePool() { if (pool) await pool.end(); }
export async function executeQuery(sql, binds = {}) {
  if (!pool) throw new Error('MySQL pool not initialized');
  const [rows] = await pool.execute(sql,binds);
  return resultOf(rows);
}
export async function withTransaction(fn) {
  if (!pool) throw new Error('MySQL pool not initialized');
  const conn = await pool.getConnection();
  try {
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.beginTransaction();
    const result = await fn(async (sql,binds={}) => resultOf((await conn.execute(sql,binds))[0]));
    await conn.commit();
    return result;
  } catch(err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
}
