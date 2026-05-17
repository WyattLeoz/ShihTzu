import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closeDb } from '../config/db.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  logger.info('Starting database migrations...');

  try {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      logger.info('No migrations found');
      return;
    }

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);
      await query({ text: sql });
      logger.info(`✓ ${file} completed`);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    process.exit(1);
  } finally {
    await closeDb();
  }
}

runMigrations();