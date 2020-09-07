import { dbPool } from '../../../application/db/db';
import { LndRun } from '../../model/lnd/run/lnd-run';
import { PoolClient } from 'pg';

export const findAllLndRuns = async (): Promise<LndRun[]> => {
    const result = await dbPool.query(`SELECT * FROM LND_RUNS`);
    const foundRows = result.rows;
    return foundRows.map((row) => {
        return new LndRun(
            row.user_domain,
            row.run_start_date,
        );
    });
};

export const existingRunningLnd = async (domainName: string): Promise<boolean> => {
    const result = await dbPool.query(`
         SELECT EXISTS (SELECT 1 FROM LND_RUNS WHERE USER_DOMAIN = $1)`, [domainName]);
    return result.rows[0].exists;
};

export const insertLndRuns = async (client: PoolClient, lndRuns: LndRun[]): Promise<void> => {
    const queryString: string = `INSERT INTO LND_RUNS(USER_DOMAIN, RUN_START_DATE) SELECT * FROM UNNEST ($1::text[], $2::timestamp[])`;
    await client.query(
        queryString,
        [
            lndRuns.map(lndRun => lndRun.userDomain),
            lndRuns.map(lndRun => lndRun.runStartDate),
        ],
    );
};

export const deleteLndRuns = async (client: PoolClient, lndRuns: LndRun[]): Promise<void> => {
    const queryString: string = `DELETE FROM LND_RUNS WHERE USER_DOMAIN IN (SELECT * FROM UNNEST ($1::text[]))`;
    await client.query(
        queryString,
        [
            lndRuns.map(lndRun => lndRun.userDomain),
        ],
    );
};
