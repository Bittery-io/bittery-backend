import { DigitalOceanArchive } from '../../../model/lnd/digital-ocean-archive';
import { PoolClient } from 'pg';

export const insertDigitalOceanArchive = async (client: PoolClient, digitalOceanArchive: DigitalOceanArchive): Promise<void> => {
    await client.query(`
        INSERT INTO DIGITAL_OCEAN_ARCHIVES(LND_ID, ARCHIVE_DATE, BACKUP_NAME)
                                          VALUES($1, $2, $3)`,
        [digitalOceanArchive.lndId, digitalOceanArchive.archiveDate, digitalOceanArchive.backupName]);
};
