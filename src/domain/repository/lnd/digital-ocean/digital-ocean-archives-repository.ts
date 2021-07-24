import { DigitalOceanArchive } from '../../../model/lnd/digital-ocean-archive';
import { dbPool } from '../../../../application/db/db';

export const insertDigitalOceanArchive = async (digitalOceanArchive: DigitalOceanArchive): Promise<void> => {
    await dbPool.query(`
        INSERT INTO DIGITAL_OCEAN_ARCHIVES(LND_ID, ARCHIVE_DATE, BACKUP_NAME)
                                          VALUES($1, $2, $3)`,
        [digitalOceanArchive.lndId, digitalOceanArchive.archiveDate, digitalOceanArchive.backupName]);
};
