import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closeDb } from '../config/db.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDir = path.join(__dirname, 'seeds');

async function runSeeds() {
  logger.info('Starting database seed...');

  try {
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (seedFiles.length === 0) {
      logger.info('No seed files found');
      return;
    }

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running seed: ${file}`);
      await query({ text: sql });
      logger.info(`✓ ${file} completed`);
    }

    logger.info('All seeds completed successfully');
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    process.exit(1);
  } finally {
    await closeDb();
  }
}

runSeeds();