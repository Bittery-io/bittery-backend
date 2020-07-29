import { dbPool } from './db';
import { PoolClient } from 'pg';
import { logError } from '../logging-service';

export const runInTransaction = async (dbFunctionsToRun: ((client: PoolClient) => void)) => {
    const client: PoolClient = await dbPool.connect();
    try {
        await client.query('BEGIN');
        await dbFunctionsToRun(client);
        await client.query('COMMIT');
    } catch (err) {
        logError('Running in transaction failed!');
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
