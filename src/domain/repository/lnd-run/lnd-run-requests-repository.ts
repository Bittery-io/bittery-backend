import { dbPool } from '../../../application/db/db';
import { LndRunRequest } from '../../model/lnd/run/lnd-run-request';
import { PoolClient } from 'pg';
import { PasswordReset } from '../../model/user/password-reset';
import { run } from 'tslint/lib/runner';

export const insertLndRunRequest = async (domainName: string) => {
    await dbPool.query(`
        INSERT INTO LND_RUN_REQUESTS(USER_DOMAIN, RUN_REQUEST_DATE) VALUES($1, $2)`, [domainName, new Date().toISOString()]);
};

//         SELECT EXISTS (SELECT 1 FROM LND_RUN_REQUESTS WHERE USER_DOMAIN = $1 AND RUN_REQUEST_DATE > (now() - interval '${hoursPeriod} hours'))`,
export const existsExistingRequestLndRun = async (domainName: string): Promise<boolean> => {
    const result = await dbPool.query(`
         SELECT EXISTS (SELECT 1 FROM LND_RUN_REQUESTS WHERE USER_DOMAIN = $1)`, [domainName]);
    return result.rows[0].exists;
};

export const findLndRunRequest = async (userDomain: string): Promise<LndRunRequest | undefined> => {
    const result = await dbPool.query(`
        SELECT * FROM LND_RUN_REQUESTS WHERE USER_DOMAIN = $1`, [userDomain]);
    return result.rows.length === 1 ? new LndRunRequest(
        result.rows[0].user_domain,
        result.rows[0].run_request_date,
    ) : undefined;
};

// export const countAllLndRunRequestsWithRunRequestDateBelow = async (runRequestDate: string): Promise<number> => {
//     const result = await dbPool.query(`
//         SELECT COUNT(*) FROM LND_RUN_REQUESTS WHERE RUN_REQUESTS_DATE < $1`, [runRequestDate]);
//     return result.rows[0].count;
// };

// find from oldest to newest
export const findLndRunRequestsToStart = async (lndRunRequestsLimit: number): Promise<LndRunRequest[]> => {
    const result = await dbPool.query(`
        SELECT * FROM LND_RUN_REQUESTS ORDER BY RUN_REQUEST_DATE ASC LIMIT $1`,
        [lndRunRequestsLimit]);
    const foundRows = result.rows;
    return foundRows.map((row) => {
        return new LndRunRequest(
            row.user_domain,
            row.run_request_date,
        );
    });
};

export const deleteRunRequests = async (client: PoolClient, lndRunRequests: LndRunRequest[]): Promise<void> => {
    const queryString: string = `DELETE FROM LND_RUN_REQUESTS WHERE USER_DOMAIN IN (SELECT * FROM UNNEST ($1::text[]))`;
    await client.query(
        queryString,
        [
            lndRunRequests.map(lndRun => lndRun.userDomain),
        ],
    );
};
