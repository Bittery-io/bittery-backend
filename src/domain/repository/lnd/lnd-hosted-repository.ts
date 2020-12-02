import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { PoolClient } from 'pg';

export const insertHostedLnd = async (client: PoolClient, hostedLnd: HostedLnd): Promise<void> => {
    await client.query(`
        INSERT INTO HOSTED_LNDS(LND_ID, HOSTED_LND_TYPE, HOSTED_LND_PROVIDER) VALUES($1, $2, $3)`,
        [hostedLnd.lndId, hostedLnd.hostedLndType, hostedLnd.hostedLndProvider]);
};
