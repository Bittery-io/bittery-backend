import { findLndRestAddress, findUserLnd, updateLndSetMacaroonHex } from '../../repository/lnd/lnds-repository';
import { lndBakeMacaroonForBtcPay, lndGenSeed, lndInitWallet, lndUnlockWallet } from './api/lnd-api-service';
import { logError, logInfo } from '../../../application/logging-service';
import { LndInitWalletDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-dto';
import { LndInitWalletResponseDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-response-dto';
import { insertUserEncryptedLnArtefacts } from '../../repository/user-encrypted-ln-artefacts-repository';
import { UserEncryptedLnArtefacts } from '../../model/user/user-encrypted-ln-artefacts';
import { sleep } from '../utils/sleep-service';
import { findDropletIp } from '../../repository/lnd/digital-ocean-lnds-repository';
import { readAdminMacaroonBase64FromLnd } from './lnd-files-service';
import { runInTransaction } from '../../../application/db/db-transaction';

export const generateLndSeed = async (userEmail: string, lndId: string): Promise<string[] | undefined> => {
    const lndRestAddress: string | undefined = await findLndRestAddress(lndId, userEmail);
    if (lndRestAddress) {
        return await lndGenSeed(lndRestAddress);
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
        return undefined;
    }
};

export const initLndWallet = async (userEmail: string, lndId: string, lndInitWalletDto: LndInitWalletDto)
        : Promise<LndInitWalletResponseDto | undefined> => {
    const lndRestAddress: string | undefined = await findLndRestAddress(lndId, userEmail);
    if (lndRestAddress) {
        // If stateless init - then macaroon will be returned on wallet init
        let adminMacaroon: string | undefined = await lndInitWallet(lndRestAddress, lndInitWalletDto);
        if (!adminMacaroon) {
            // otherwise it must be downloaded
            const dropletIp: string = await findDropletIp(lndId, userEmail);
            adminMacaroon = await readAdminMacaroonBase64FromLnd(userEmail, dropletIp);
        }
        await sleep(5000);
        const bitteryBakedMacaroonHex: string | undefined =
            await lndBakeMacaroonForBtcPay(lndRestAddress, Buffer.from(adminMacaroon, 'base64').toString('hex'));
        await runInTransaction(async (client) => {
            await insertUserEncryptedLnArtefacts(client, new UserEncryptedLnArtefacts(userEmail, lndId, adminMacaroon,
                lndInitWalletDto.seedMnemonicEncrypted, lndInitWalletDto.passwordEncrypted));
            if (bitteryBakedMacaroonHex) {
                await updateLndSetMacaroonHex(client, lndId, bitteryBakedMacaroonHex);
                logInfo(`Updated Bittery permissions baked macaroon hex for LND with id ${lndId} for user ${userEmail}`);
            }
        });
        return new LndInitWalletResponseDto(adminMacaroon);
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
    }
    return undefined;
};

export const unlockLnd = async (userEmail: string, lndId: string, password: string)
        : Promise<boolean> => {
    const lndRestAddress: string | undefined = await findLndRestAddress(lndId, userEmail);
    if (lndRestAddress) {
        return await lndUnlockWallet(lndRestAddress, password);
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
    }
    return false;
};
