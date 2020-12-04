import { DigitalOceanFailure } from '../../model/lnd/hosted/digital_ocean/digital-ocean-failure';
import { dbPool } from '../../../application/db/db';

export const insertDigitalOceanFailure = async (digitalOceanFailure: DigitalOceanFailure): Promise<void> => {
    await dbPool.query(`
        INSERT INTO DIGITAL_OCEAN_FAILURES(USER_EMAIL, DROPLET_ID, DROPLET_NAME, DROPLET_IP,
                                          RTL_ONE_TIME_INIT_PASSWORD, CREATION_DATE, HOSTED_LND_TYPE, FAILED_DEPLOYMENT_STAGE)
                                          VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [digitalOceanFailure.userEmail, digitalOceanFailure.dropletId, digitalOceanFailure.dropletName,
            digitalOceanFailure.dropletIp, digitalOceanFailure.rtlOneTimeInitPassword, digitalOceanFailure.creationDate,
            digitalOceanFailure.hostedLndType, digitalOceanFailure.failedDeploymentStage]);
};
