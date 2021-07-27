import { logInfo } from '../../../application/logging-service';
import { connectSshToNode, startLndInDroplet } from './provisioning/lnd-droplet-digital-ocean-provision-service';
import { DigitalOceanLndForRestart } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';
import { findDigitalOceanLndForRestart } from '../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';
import { getProperty } from '../../../application/property-service';

// This will restart user LND
// Can be used for settings change
// Params which are configured:
// BITCOIND_RPC_HOST - took from ENV var BITCOIND_RPC_HOST
// BITCOIND_RPC_USER - took from ENV var BITCOIND_RPC_USER
// BITCOIND_RPC_PASSWORD - took from ENV var BITCOIND_RPC_PASSWORD
// LND_HOSTED_VERSION - took from ENV var LND_HOSTED_VERSION
// RTL_HOSTED_VERSION - took from ENV var RTL_HOSTED_VERSION
// dropletPublicIp - took from db
// lnAliasString - took from db (can be changed)
// wumboChannels - took from db (can be changed)
// rtlOneTimePassword is not used because is not possible to change
export const restartLnd = async (lndId: string, userEmail: string): Promise<void> => {
    const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined = await findDigitalOceanLndForRestart(lndId, userEmail);
    if (digitalOceanLndForRestart) {
        const ssh: any = await connectSshToNode(userEmail, digitalOceanLndForRestart.dropletIp, digitalOceanLndForRestart.dropletId);
        await startLndInDroplet(
            ssh,
            digitalOceanLndForRestart.dropletIp,
            digitalOceanLndForRestart.wumboChannels,
            getProperty('BITCOIND_RPC_HOST'),
            getProperty('BITCOIND_RPC_USER'),
            getProperty('BITCOIND_RPC_PASSWORD'),
            getProperty('LND_HOSTED_VERSION'),
            getProperty('RTL_HOSTED_VERSION'),
            // no need to pass rtl one time password again it will have no effect cause its already set
            undefined,
            digitalOceanLndForRestart.lnAlias);
        logInfo(`Restarting digital ocean LND with id ${lndId} for user ${userEmail} succeed!`);
    } else {
        const message: string = `Cannot restart digital ocean LND with id ${lndId} for user ${userEmail} because such LND was not found!`;
        throw Error(message);
    }
};
