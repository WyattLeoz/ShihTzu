import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetDatabase() {
  try {
    // Connect to postgres database (not quickaid) to drop/create quickaid
    const postgresUrl = process.env.DATABASE_URL!.replace(/\/[^/]+$/, '/postgres');
    const postgresPool = new Pool({ connectionString: postgresUrl });

    console.log('Terminating existing connections...');
    await postgresPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'quickaid'
      AND pid <> pg_backend_pid();
    `);

    console.log('Dropping existing database...');
    await postgresPool.query('DROP DATABASE IF EXISTS quickaid');

    console.log('Creating new database...');
    await postgresPool.query('CREATE DATABASE quickaid');

    await postgresPool.end();
    console.log('✓ Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();