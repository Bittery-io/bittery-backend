import { logInfo } from '../../../application/logging-service';
import { connectSshToNode, startLndInDroplet } from './provisioning/lnd-droplet-digital-ocean-provision-service';
import { getProperty } from '../../../application/property-service';
import { findUserLndAggregateByIdAndEmail } from '../../repository/lnd/lnds-repository';
import { LndAggregate } from '../../model/lnd/lnd-aggregate';

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
    const lndAggregate: LndAggregate | undefined = await findUserLndAggregateByIdAndEmail(lndId, userEmail);
    if (lndAggregate && lndAggregate.digitalOceanLnd) {
        const ssh: any = await connectSshToNode(userEmail, lndAggregate.digitalOceanLnd.dropletIp, lndAggregate.digitalOceanLnd.dropletId);
        await startLndInDroplet(
            ssh,
            lndAggregate.digitalOceanLnd.dropletIp,
            lndAggregate.digitalOceanLnd.wumboChannels,
            getProperty('BITCOIND_RPC_HOST'),
            getProperty('BITCOIND_RPC_USER'),
            getProperty('BITCOIND_RPC_PASSWORD'),
            // getProperty('LND_HOSTED_VERSION'),
            lndAggregate.lnd.lndVersion,
            // for encrypted LND no matter what value will be passed
            lndAggregate.rtl ? lndAggregate.rtl.rtlVersion : getProperty('RTL_HOSTED_VERSION'),
            // no need to pass rtl one time password again it will have no effect cause its already set
            undefined,
            lndAggregate.digitalOceanLnd.lnAlias);
        logInfo(`Restarting digital ocean LND with id ${lndId} for user ${userEmail} succeed!`);
    } else {
        const message: string = `Cannot restart digital ocean LND with id ${lndId} for user ${userEmail} because such LND was not found!`;
        throw Error(message);
    }
};
