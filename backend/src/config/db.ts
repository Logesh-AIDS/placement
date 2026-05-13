import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ── Neon-optimised pool ───────────────────────────────────────────────────────
// Neon serverless pauses after ~5 min of inactivity and drops TCP connections.
// Settings below prevent stale connections from causing 500 errors:
//   - idleTimeoutMillis: 0  → never keep idle connections (Neon closes them anyway)
//   - max: 3               → Neon free tier allows limited concurrent connections
//   - allowExitOnIdle: true → let the process exit cleanly when idle
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 0,          // release connections immediately when idle
  connectionTimeoutMillis: 10000, // 10 s to acquire a connection
  allowExitOnIdle: true,
});

// Log pool errors but DO NOT exit — the pool will create a fresh connection
// on the next query automatically.
pool.on('error', (err) => {
  console.error('[DB] Pool client error (will reconnect):', err.message);
});

// ── query() with one automatic retry on connection errors ─────────────────────
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);

    if (process.env.NODE_ENV === 'development') {
      const ms = Date.now() - start;
      console.log(`[DB] ${text.slice(0, 80)} | ${ms}ms | ${result.rowCount} rows`);
    }

    return result;
  } catch (err: unknown) {
    const isConnectionError =
      err instanceof Error &&
      (err.message.includes('Connection terminated') ||
        err.message.includes('connection timeout') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT') ||
        (err as NodeJS.ErrnoException).code === 'ECONNRESET');

    if (isConnectionError) {
      console.warn('[DB] Stale connection detected — retrying query once…');
      // Small delay to let Neon resume the compute
      await new Promise((r) => setTimeout(r, 1500));
      const result = await pool.query(text, params);

      if (process.env.NODE_ENV === 'development') {
        const ms = Date.now() - start;
        console.log(`[DB] (retry) ${text.slice(0, 80)} | ${ms}ms | ${result.rowCount} rows`);
      }

      return result;
    }

    throw err;
  }
};

// ── getClient() for manual transaction management ─────────────────────────────
export const getClient = (): Promise<PoolClient> => pool.connect();

export default pool;
