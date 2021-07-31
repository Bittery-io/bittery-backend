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
import { logInfo } from '../../../application/logging-service';
import {
    findUserEncryptedLnArtefacts,
    insertUserEncryptedLnArtefacts,
} from '../../repository/encrypted/user-encrypted-ln-artefacts-repository';
import { UserEncryptedLnArtefact } from '../../model/encrypted/user-encrypted-ln-artefact';
import { Rtl } from '../../model/lnd/hosted/rtl/rtl';
import { updateUserBtcStoreWithActiveLnd } from '../btcpay/btcpay-service';

export const restoreLnd = async (userEmail: string, lndIdToRestore: string): Promise<void> => {
    const hostedLnd: HostedLnd | undefined = await findUserHostedLnd(userEmail, lndIdToRestore);
    if (hostedLnd) {
        const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined = await findDigitalOceanLndForRestart(hostedLnd.lndId, userEmail);
        if (digitalOceanLndForRestart) {
            const digitalOceanArchive: DigitalOceanArchive | undefined = await findDigitalOceanArchive(lndIdToRestore);
            if (digitalOceanArchive) {
                const rtlForLndToRestore: Rtl | undefined = await findRtl(lndIdToRestore);
                const newDigitalOceanLndHosting: DigitalOceanLndHosting = await createNewLndBasedOnOldLnd(hostedLnd, userEmail, rtlForLndToRestore);
                await restoreLndInDroplet(
                    userEmail,
                    newDigitalOceanLndHosting.digitalOceanLnd.dropletIp,
                    newDigitalOceanLndHosting.digitalOceanLnd.dropletId,
                    digitalOceanLndForRestart.dropletId,
                    digitalOceanArchive.backupName,
                );
                // 1. Update encrypted artefacts - copy them for new LND
                const userEncryptedLnArtefacts: UserEncryptedLnArtefact[] = await findUserEncryptedLnArtefacts(userEmail, lndIdToRestore);
                userEncryptedLnArtefacts.forEach((_) => {
                    _.id = generateUuid();
                    _.lndId = newDigitalOceanLndHosting.digitalOceanLnd.lndId;
                });
                // 2. Replace macaroon HEX with previous macaroon LND macaroon hex
                const macaroonHex: string | undefined = await findLndMacaroonHex(lndIdToRestore, userEmail);
                await runInTransaction(async (client) => {
                    await insertLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                    if (hostedLnd.hostedLndType === HostedLndType.STANDARD) {
                        await insertHostedLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                        await insertUserRtl(client, newDigitalOceanLndHosting.rtl!);
                        await insertDigitalOceanLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                    } else {
                        await insertHostedLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                        await insertDigitalOceanLnd(client, newDigitalOceanLndHosting.digitalOceanLnd);
                    }
                    await insertUserEncryptedLnArtefacts(client, userEncryptedLnArtefacts);
                    await updateLndSetMacaroonHex(newDigitalOceanLndHosting.digitalOceanLnd.lndId, macaroonHex!, client);
                });
                await updateUserBtcStoreWithActiveLnd(userEmail);
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
const createNewLndBasedOnOldLnd = async (hostedLnd: HostedLnd, userEmail: string, rtl?: Rtl): Promise<DigitalOceanLndHosting> => {
    const lndId: string = generateUuid();
    const digitalOceanLndHosting: DigitalOceanLndHosting | undefined = await provisionDigitalOceanLnd(
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
    return digitalOceanLndHosting!;
};
