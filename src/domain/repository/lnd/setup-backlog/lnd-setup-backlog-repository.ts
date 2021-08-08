import { dbPool } from '../../../../application/db/db';
import { LndSetupBacklog } from '../../../model/lnd/setup-backlog/lnd-setup-backlog';
import { PoolClient } from 'pg';

export const insertLndSetupBacklog = async (lndSetupBacklog: LndSetupBacklog): Promise<void> => {
    await dbPool.query(`
        INSERT INTO LND_SETUP_BACKLOG (USER_EMAIL, CREATION_DATE) VALUES($1, $2)`,
        [lndSetupBacklog.userEmail, lndSetupBacklog.creationDate]);
};

export const deleteLndSetupBacklog = async (userEmail: string, client?: PoolClient): Promise<void> => {
    await (client ?? dbPool).query(`DELETE FROM LND_SETUP_BACKLOG WHERE USER_EMAIL = $1`, [userEmail]);
};

export const lndSetupBacklogExists = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM LND_SETUP_BACKLOG WHERE USER_EMAIL = $1)`,
        [userEmail]);
    return result.rows[0].exists;
};
