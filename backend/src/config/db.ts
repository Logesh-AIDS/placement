import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Neon serverless PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] query: ${text.slice(0, 80)} | duration: ${duration}ms | rows: ${result.rowCount}`);
  }

  return result;
};

export const getClient = () => pool.connect();

export default pool;
