import { DigitalOceanLnd } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { PoolClient } from 'pg';
import { dbPool } from '../../../application/db/db';
import { DigitalOceanLndForRestart } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';

export const insertDigitalOceanLnd = async (client: PoolClient, digitalOceanLnd: DigitalOceanLnd): Promise<void> => {
    await client.query(`
        INSERT INTO DIGITAL_OCEAN_LNDS(LND_ID, DROPLET_ID, DROPLET_NAME, DROPLET_IP) VALUES($1, $2, $3, $4)`,
        [digitalOceanLnd.lndId, digitalOceanLnd.dropletId, digitalOceanLnd.dropletName, digitalOceanLnd.dropletIp]);
};

export const findDigitalOceanLndForRestart = async (lndId: string, userEmail: string): Promise<DigitalOceanLndForRestart | undefined> => {
    const result = await dbPool.query(`SELECT dol.DROPLET_IP, dol.DROPLET_ID, hl.WUMBO_CHANNELS, hl.LN_ALIAS 
                                FROM DIGITAL_OCEAN_LNDS dol JOIN hosted_lnds hl ON dol.LND_ID = hl.LND_ID
                                JOIN LNDS l ON l.LND_ID = dol.LND_ID WHERE l.LND_ID = $1 AND l.USER_EMAIL = $2`,
        [lndId, userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? new DigitalOceanLndForRestart(
        foundRow.droplet_ip,
        foundRow.droplet_id,
        foundRow.wumboChannels,
        foundRow.lnAlias,
    ) : undefined;
};

export const findDropletIp = async (lndId: string, userEmail: string): Promise<string> => {
    const result = await dbPool.query(`SELECT dol.DROPLET_IP FROM DIGITAL_OCEAN_LNDS dol JOIN LNDS l on l.lnd_id = dol.lnd_id
                                                      WHERE l.lnd_id = $1 and l.user_email = $2`, [lndId, userEmail]);
    const foundRow = result.rows[0];
    return foundRow.droplet_ip;
};
