import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import { connectionOptions } from '../src/db/pool.js';

const options = connectionOptions();
const name = options.database;
if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name)) throw new Error('Invalid MYSQL_DATABASE');
const conn = await mysql.createConnection({ ...options, database: undefined, multipleStatements: true });
try {
  const [existing] = await conn.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[name]);
  if (existing.length) throw new Error('Database already exists. Nothing changed. Choose a new MYSQL_DATABASE to preserve existing data.');
  await conn.query('CREATE DATABASE `'+name+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  await conn.changeUser({ database: name });
  const sql = await fs.readFile(new URL('../../database/queue_intelligence_system_mysql.sql',import.meta.url),'utf8');
  await conn.query(sql);
  console.log('Created and seeded MySQL database: '+name);
} finally { await conn.end(); }
