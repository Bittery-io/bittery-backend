import { DigitalOceanArchive } from '../../../model/lnd/digital-ocean-archive';
import { PoolClient } from 'pg';
import { dbPool } from '../../../../application/db/db';

export const insertDigitalOceanArchive = async (client: PoolClient, digitalOceanArchive: DigitalOceanArchive): Promise<void> => {
    await client.query(`
        INSERT INTO DIGITAL_OCEAN_ARCHIVES(LND_ID, ARCHIVE_DATE, BACKUP_NAME)
                                          VALUES($1, $2, $3)`,
        [digitalOceanArchive.lndId, digitalOceanArchive.archiveDate, digitalOceanArchive.backupName]);
};

export const findDigitalOceanArchive = async (lndId: string): Promise<DigitalOceanArchive | undefined> => {
    const result = await dbPool.query(`
        SELECT * FROM DIGITAL_OCEAN_ARCHIVES WHERE LND_ID = $1`,
        [lndId]);
    return result.rows.length === 1 ? new DigitalOceanArchive(
        result.rows[0].lnd_id,
        result.rows[0].archive_date,
        result.rows[0].backup_name,
    ) : undefined;
};
