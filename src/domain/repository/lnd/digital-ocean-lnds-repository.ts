import { DigitalOceanLnd } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { PoolClient } from 'pg';

export const insertDigitalOceanLnd = async (client: PoolClient, digitalOceanLnd: DigitalOceanLnd): Promise<void> => {
    await client.query(`
        INSERT INTO DIGITAL_OCEAN_LNDS(LND_ID, DROPLET_ID, DROPLET_NAME, DROPLET_IP) VALUES($1, $2, $3, $4)`,
        [digitalOceanLnd.lndId, digitalOceanLnd.dropletId, digitalOceanLnd.dropletName, digitalOceanLnd.dropletId]);
};
