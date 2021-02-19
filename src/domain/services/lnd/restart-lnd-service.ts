import { logInfo } from '../../../application/logging-service';
import { connectSshToNode, startLndInDroplet } from './provisioning/lnd-droplet-digital-ocean-provision-service';
import { findDigitalOceanLndForRestart } from '../../repository/lnd/digital-ocean-lnds-repository';
import { DigitalOceanLndForRestart } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';

export const restartLnd = async (lndId: string, userEmail: string): Promise<void> => {
    const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined = await findDigitalOceanLndForRestart(lndId, userEmail);
    if (digitalOceanLndForRestart) {
        const ssh: any = await connectSshToNode(userEmail, digitalOceanLndForRestart.dropletIp, digitalOceanLndForRestart.dropletId);
        // no need to pass rtl one time password again it will have no effect cause its already set
        await startLndInDroplet(ssh, digitalOceanLndForRestart.dropletIp, digitalOceanLndForRestart.wumboChannels, undefined,
            digitalOceanLndForRestart.lnAlias);
        logInfo(`Restarting digital ocean LND with id ${lndId} for user ${userEmail} succeed!`);
    } else {
        const message: string = `Cannot restart digital ocean LND with id ${lndId} for user ${userEmail} because such LND was not found!`;
        throw Error(message);
    }
};
