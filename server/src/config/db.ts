import { Pool, PoolClient, QueryResult } from 'pg';
import { env } from './env';
import logger from './logger';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle client');
  process.exit(-1);
});

export interface QueryOptions {
  name?: string;
  text: string;
  values?: any[];
}

export async function query<T = any>(options: QueryOptions): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(options);
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn(
        { queryName: options.name, duration },
        'Slow query detected'
      );
    }

    return result;
  } catch (error) {
    logger.error(
      { error, queryName: options.name, query: options.text },
      'Database query failed'
    );
    throw error;
  }
}

export interface TransactionCallback<T> {
  (client: PoolClient): Promise<T>;
}

export async function transaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Transaction failed, rolled back');
    throw error;
  } finally {
    client.release();
  }
}

export async function initDb(): Promise<void> {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
  logger.info('Database connection pool closed');
}

export default pool;