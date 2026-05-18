import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ── Neon-optimised pool ───────────────────────────────────────────────────────
// Neon serverless pauses after ~5 min of inactivity and drops TCP connections.
// Settings below prevent stale connections from causing 500 errors:
//   - idleTimeoutMillis: 30000 → release idle connections after 30s
//   - max: 5                   → Neon free tier allows limited concurrent connections
//   - allowExitOnIdle: true    → let the process exit cleanly when idle
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,       // release connections after 30s idle
  connectionTimeoutMillis: 15000, // 15s to acquire a connection (Neon can be slow to wake)
  allowExitOnIdle: true,
});

// Log pool errors but DO NOT exit — the pool will create a fresh connection
// on the next query automatically.
pool.on('error', (err) => {
  console.error('[DB] Pool client error (will reconnect):', err.message);
});

// ── query() with automatic retry on connection errors ────────────────────────
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);

      if (process.env.NODE_ENV === 'development') {
        const ms = Date.now() - start;
        const retryMsg = attempt > 1 ? ` (attempt ${attempt})` : '';
        console.log(`[DB]${retryMsg} ${text.slice(0, 80)} | ${ms}ms | ${result.rowCount} rows`);
      }

      return result;
    } catch (err: unknown) {
      lastError = err;
      
      const isConnectionError =
        err instanceof Error &&
        (err.message.includes('Connection terminated') ||
          err.message.includes('connection timeout') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('no more connections') ||
          (err as NodeJS.ErrnoException).code === 'ECONNRESET');

      if (isConnectionError && attempt < maxRetries) {
        const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
        console.warn(`[DB] Connection error (attempt ${attempt}/${maxRetries}) — retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Not a connection error or max retries reached
      throw err;
    }
  }

  throw lastError;
};

// ── getClient() for manual transaction management ─────────────────────────────
export const getClient = (): Promise<PoolClient> => pool.connect();

export default pool;
