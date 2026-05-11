import app from './app';
import pool from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection before starting
    await pool.query('SELECT 1');
    console.log('✅ Database connected (Neon PostgreSQL)');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing database pool...');
  await pool.end();
  process.exit(0);
});

startServer();
