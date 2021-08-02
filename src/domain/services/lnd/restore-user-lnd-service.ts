import { CreateLndDto } from '../../../interfaces/dto/lnd/create-lnd-dto';
import { findLndMacaroonHex, insertLnd, updateLndSetMacaroonHex } from '../../repository/lnd/lnds-repository';
import { generateUuid } from '../utils/id-generator-service';
import { DigitalOceanLndHosting } from '../../model/lnd/digital-ocean-lnd-hosting';
import { provisionDigitalOceanLnd } from './provisioning/digital-ocean-lnd-provision-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { findUserHostedLnd, insertHostedLnd } from '../../repository/lnd/lnd-hosted-repository';
import { findRtl, insertUserRtl } from '../../repository/lnd/rtls-repository';
import {
    findDigitalOceanLndForRestart,
    insertDigitalOceanLnd,
} from '../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';
import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { DigitalOceanLndForRestart } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';
import { restoreLndInDroplet } from './provisioning/digital-ocean-restore-lnd-service';
import { findDigitalOceanArchive } from '../../repository/lnd/digital-ocean/digital-ocean-archives-repository';
import { DigitalOceanArchive } from '../../model/lnd/digital-ocean-archive';
import { logError, logInfo } from '../../../application/logging-service';
import {
    findUserEncryptedLnArtefacts,
    insertUserEncryptedLnArtefacts,
} from '../../repository/encrypted/user-encrypted-ln-artefacts-repository';
import { UserEncryptedLnArtefact } from '../../model/encrypted/user-encrypted-ln-artefact';
import { Rtl } from '../../model/lnd/hosted/rtl/rtl';
import { updateUserBtcStoreWithActiveLnd } from '../btcpay/btcpay-service';
import { sendErrorOccurredEmailToAdmin } from '../../../application/mail-service';

/**
 * This process if based on 4 steps. Every can fail. There is no automatically restore process (must be done manually).
 * 1. Provision new LND in digital ocean. If fails: stop process (must be done again).
 * 2. Restore LND in droplet. If fails: stop process (must be done again) - but new LND from step 1 must be removed manually.
 * 3. Insert all data to database. If fails: stop process (must be done again) -
 *      however restored LND is already working in digital ocean so must be carefully stopped!
 * 4. Update user store with new LND address. If fails: store cannot receive Lightning payments (bad). Must be manually fixed.
 */
export const restoreLnd = async (userEmail: string, lndIdToRestore: string): Promise<void> => {
    logInfo(`[RESTORE LND] Started restore LND process for LND to restore with id ${lndIdToRestore} for user email ${userEmail}.`);
    const hostedLndToRestore: HostedLnd | undefined = await findUserHostedLnd(userEmail, lndIdToRestore);
    if (hostedLndToRestore) {
        const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined =
            await findDigitalOceanLndForRestart(hostedLndToRestore.lndId, userEmail);
        if (digitalOceanLndForRestart) {
            const digitalOceanArchive: DigitalOceanArchive | undefined = await findDigitalOceanArchive(lndIdToRestore);
            if (digitalOceanArchive) {
                const rtlForLndToRestore: Rtl | undefined = await findRtl(lndIdToRestore);
                const newDigitalOceanLndHosting: DigitalOceanLndHosting | undefined =
                    await createNewLndBasedOnOldLnd(hostedLndToRestore, userEmail, rtlForLndToRestore);
                if (!newDigitalOceanLndHosting) {
                    const message: string = `[RESTORE LND] Restore lnd failed: creating new LND based on old LND in digital ocean failed with error for LND to restore ${lndIdToRestore} for user email ${userEmail}`;
                    await sendErrorOccurredEmailToAdmin(message);
                    throw new Error(message);
                }
                const restored: boolean = await restoreLndInDroplet(
                    userEmail,
                    newDigitalOceanLndHosting.digitalOceanLnd.dropletIp,
                    newDigitalOceanLndHosting.digitalOceanLnd.dropletId,
                    digitalOceanLndForRestart.dropletId,
                    digitalOceanArchive.backupName,
                );
                if (!restored) {
                    const message: string = `[RESTORE LND] Restore lnd failed: restore old LND based in digital ocean failed with error for LND to restore ${lndIdToRestore} for user email ${userEmail}. New LND (probably to remove): ${newDigitalOceanLndHosting.digitalOceanLnd.lndId}, droplet IP: ${newDigitalOceanLndHosting.digitalOceanLnd.dropletIp}`;
                    await sendErrorOccurredEmailToAdmin(message);
                    throw new Error(message);
                }
                // 1. Update encrypted artefacts - copy them for new LND
                const userEncryptedLnArtefacts: UserEncryptedLnArtefact[] = await findUserEncryptedLnArtefacts(userEmail, lndIdToRestore);
                userEncryptedLnArtefacts.forEach((_) => {
                    _.id = generateUuid();
                    _.lndId = newDigitalOceanLndHosting.digitalOceanLnd.lndId;
                });
                // 2. Replace macaroon HEX with previous macaroon LND macaroon hex
                newDigitalOceanLndHosting.digitalOceanLnd.macaroonHex = hostedLndToRestore.macaroonHex;
                // 3. Replace public key with previous public key
                newDigitalOceanLndHosting.digitalOceanLnd.publicKey = hostedLndToRestore.publicKey;
                try {
                    await runInTransaction(async (client) => {
                        await insertLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                        if (hostedLndToRestore.hostedLndType === HostedLndType.STANDARD) {
                            await insertHostedLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                            await insertUserRtl(client, newDigitalOceanLndHosting.rtl!);
                            await insertDigitalOceanLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                        } else {
                            await insertHostedLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                            await insertDigitalOceanLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                        }
                        await insertUserEncryptedLnArtefacts(client, userEncryptedLnArtefacts);
                    });
                } catch (err) {
                    const message: string = `[RESTORE LND] Restore lnd failed: DB transaction error during restore ${lndIdToRestore} for user email ${userEmail}. New LND (probably to remove): ${newDigitalOceanLndHosting.digitalOceanLnd.lndId}, droplet IP: ${newDigitalOceanLndHosting.digitalOceanLnd.dropletIp}. Db error: ${err.message}`;
                    await sendErrorOccurredEmailToAdmin(message);
                    throw new Error(message);
                }
                await updateUserBtcStoreWithActiveLnd(
                    userEmail,
                    newDigitalOceanLndHosting.digitalOceanLnd.lndRestAddress,
                    // When LND is provisioned it has macaroon set as empty
                    // When restoring - old macaroons are used anyway, so in this case old LND macaroon can be used.
                    hostedLndToRestore.macaroonHex!,
                    newDigitalOceanLndHosting.digitalOceanLnd.tlsCertThumbprint);
                logInfo(`Successfully restored LND with id ${lndIdToRestore} for user email ${userEmail}. New LND has id: ${newDigitalOceanLndHosting.digitalOceanLnd.lndId}`);
            } else {
                // tslint:disable-next-line:max-line-length
                throw new Error(`Restore lnd failed: cannot find digital ocean archive for LND with id ${lndIdToRestore} for user email ${userEmail}`);
            }
        } else {
            throw new Error(`Restore lnd failed: cannot find digital ocean LND with id ${lndIdToRestore} for user email ${userEmail}`);
        }
    } else {
        throw new Error(`Restore lnd failed: cannot find hosted LND with id ${lndIdToRestore} for user email ${userEmail}`);
    }
};
const createNewLndBasedOnOldLnd = async (hostedLnd: HostedLnd, userEmail: string, rtl?: Rtl): Promise<DigitalOceanLndHosting | undefined> => {
    const lndId: string = generateUuid();
    return await provisionDigitalOceanLnd(
        userEmail,
        lndId,
        new CreateLndDto(
            hostedLnd.hostedLndType,
            hostedLnd.lnAlias,
        ),
        hostedLnd.lndVersion,
        rtl ? rtl.rtlVersion : undefined,
        rtl ? rtl.rtlOneTimeInitPassword : undefined,
    );
};
