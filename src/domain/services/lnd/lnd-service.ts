import {
    findLndRestAddress, findUserActiveLndAggregate,
    updateLndSetMacaroonHex,
    updateLndSetPublicKey,
} from '../../repository/lnd/lnds-repository';
import {
    lndBakeMacaroonForBtcPay,
    lndGenSeed,
    lndGetInfo,
    lndInitWallet,
    lndUnlockWallet,
} from './api/lnd-api-service';
import { logError, logInfo, logWarn } from '../../../application/logging-service';
import { LndInitWalletDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-dto';
import { LndInitWalletResponseDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-response-dto';
import { sleep } from '../utils/sleep-service';
import { readAdminMacaroonBase64FromLnd } from './lnd-files-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { insertUserEncryptedLnArtefacts } from '../../repository/encrypted/user-encrypted-ln-artefacts-repository';
import { UserEncryptedLnArtefact } from '../../model/encrypted/user-encrypted-ln-artefact';
import { generateUuid } from '../utils/id-generator-service';
import { EncryptedLnArtefactType } from '../../model/encrypted/encrypted-ln-artefact-type';
import { findDropletIp } from '../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';
import { LndInfo } from '../../model/lnd/api/lnd-info';
import { LndAggregate } from '../../model/lnd/lnd-aggregate';

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

/**
 * This process is done in 3 steps:
 * 1. Init lnd in binary (on droplet). Can succeed or fail. If fail: stop process.
 * 2. Bake custom Bittery macaroon. Can succeed or fail.
 *    If succeed it will be updated for LND if failed: admin macaroon with BITTERY prefix will be updated for LND.
 *    On fail the process will be automatically later retried (during UNLOCK) to bake Bittery macaroon until success (so good).
 * 3. Get lnd info for public key. Can succeed or fail.
 *    If succeed public key will be updated for LND. If fail - no update.
 *    On fail the processs will be automatically later (during UNLOCK) retired to get public key until success (so good).
 *
 * If this process will fail on DB transaction when binary init success - it is unfortunatelly not handled. It will lock user setup.
 */
export const initLndWallet = async (userEmail: string, lndId: string, lndInitWalletDto: LndInitWalletDto)
        : Promise<LndInitWalletResponseDto | undefined> => {
    const lndRestAddress: string | undefined = await findLndRestAddress(lndId, userEmail);
    if (lndRestAddress) {
        let adminMacaroonBase64: string | undefined;
        try {
            // If stateless init - then macaroon will be returned on wallet init, otherwise undefined and its good
            adminMacaroonBase64 = await lndInitWallet(lndRestAddress, lndInitWalletDto);
            logInfo(`[INIT WALLET] Successfully init LND wallet (in binary) for lnd ${lndId} and user email ${userEmail}`);
        } catch (err) {
            logError(`[INIT WALLET] Init LND wallet for lnd ${lndId} and user email ${userEmail} failed! Stopping init wallet as failed - wallet will have to be init again later.`);
            return undefined;
        }
        if (!adminMacaroonBase64) {
            try {
                // otherwise it must be downloaded
                const dropletIp: string = await findDropletIp(lndId, userEmail);
                adminMacaroonBase64 = await readAdminMacaroonBase64FromLnd(userEmail, dropletIp);
            } catch (err) {
                logError(`[INIT WALLET] Reading admin macaroon base64 for lnd ${lndId} and user email ${userEmail} failed. Wallet is init but not having admin.macaroon.`);
                return undefined;
            }
        }
        await sleep(5000);
        const adminMacaroonHex: string = Buffer.from(adminMacaroonBase64, 'base64').toString('hex');
        const bitteryBakedMacaroonHex: string | undefined = await lndBakeMacaroonForBtcPay(lndRestAddress, adminMacaroonHex);
        const lndInfo: LndInfo | undefined = await lndGetInfo(lndRestAddress, bitteryBakedMacaroonHex!);
        await runInTransaction(async (client) => {
            // todo this is kind of hack of pushing adminMacaroon not encrypted - it will be saved again client side encrypted
            // todo after this call ends however I do it here for being sure it's saved... to be fixed/done better rather
            const dateNow: string = new Date().toUTCString();
            await insertUserEncryptedLnArtefacts(client,
                [
                    new UserEncryptedLnArtefact(
                        generateUuid(),
                        userEmail,
                        lndId,
                        EncryptedLnArtefactType.ADMIN_MACAROON_HEX,
                        adminMacaroonHex,
                        dateNow,
                    ),
                    new UserEncryptedLnArtefact(
                        generateUuid(),
                        userEmail,
                        lndId,
                        EncryptedLnArtefactType.LN_SEED_MNEMONIC,
                        lndInitWalletDto.seedMnemonicEncrypted,
                        dateNow,
                    ),
                    new UserEncryptedLnArtefact(
                        generateUuid(),
                        userEmail,
                        lndId,
                        EncryptedLnArtefactType.LN_PASSWORD,
                        lndInitWalletDto.passwordEncrypted,
                        dateNow,
                    ),
                ]);
            if (bitteryBakedMacaroonHex) {
                await updateLndSetMacaroonHex(lndId, bitteryBakedMacaroonHex, client);
                logInfo(`[INIT WALLET] Updated Bittery permissions baked macaroon hex for LND with id ${lndId} for user ${userEmail}`);
            } else {
                await updateLndSetMacaroonHex(lndId, `BITTERY${adminMacaroonHex}`, client);
                logWarn(`[INIT WALLET] Could not update Bittery permissions baked macaroon hex for LND with id ${lndId} for user ${userEmail} because is undefined of some reason. Setting bare adminMacaroonHex temporary!`);
            }
            if (lndInfo) {
                await updateLndSetPublicKey(lndId, lndInfo.publicKey, client);
                logInfo(`[INIT WALLET] Updated public key for LND with id ${lndId} for user ${userEmail}`);
            } else {
                logError(`[INIT WALLET] Fatal: could not update public key for LND with id ${lndId} for user ${userEmail} because is undefined of some reason!`);
            }
        });
        return new LndInitWalletResponseDto(adminMacaroonHex);
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
    }
    return undefined;
};

const tryToRestoreProcessWhichFailedPreviously = async (lndAggregate: LndAggregate): Promise<void> => {
    let macaroonHex: string | undefined;
    // if macaroonHex is set by artificial (with BITTERY string) then bake custom
    if (lndAggregate.lnd.macaroonHex?.startsWith('BITTERY')) {
        const adminMacaroonHex: string = lndAggregate.lnd.macaroonHex?.slice('BITTERY'.length, lndAggregate.lnd.macaroonHex?.length);
        const bitteryBakedMacaroonHex: string | undefined = await lndBakeMacaroonForBtcPay(lndAggregate.lnd.lndRestAddress, adminMacaroonHex);
        if (bitteryBakedMacaroonHex) {
            await updateLndSetMacaroonHex(lndAggregate.lnd.lndId, bitteryBakedMacaroonHex);
            logInfo(`[INIT WALLET restore] Updated Bittery permissions baked macaroon hex for LND with id ${lndAggregate.lnd.lndId} for user ${lndAggregate.lnd.userEmail}`);
        } else {
            logWarn(`[INIT WALLET restore] Could not update Bittery permissions baked macaroon hex for LND with id ${lndAggregate.lnd.lndId} for user ${lndAggregate.lnd.userEmail} because is undefined of some reason. Will try next time!`);
        }
        macaroonHex = bitteryBakedMacaroonHex;
    }
    // if no public key but (macaroonHex is set in step above or is already good macaroon in db)
    if (!lndAggregate.lnd.publicKey && (macaroonHex || !lndAggregate.lnd.macaroonHex?.startsWith('BITTERY'))) {
        if (!macaroonHex) {
            if (lndAggregate.lnd.macaroonHex?.startsWith('BITTERY')) {
                macaroonHex = lndAggregate.lnd.macaroonHex?.slice('BITTERY'.length, lndAggregate.lnd.macaroonHex?.length);
            } else {
                macaroonHex = lndAggregate.lnd.macaroonHex;
            }
        }
        const lndInfo: LndInfo | undefined = await lndGetInfo(lndAggregate.lnd.lndRestAddress, macaroonHex!);
        if (lndInfo) {
            await updateLndSetPublicKey(lndAggregate.lnd.lndId, lndInfo.publicKey);
            logInfo(`[INIT WALLET restore] Updated public key for LND with id ${lndAggregate.lnd.lndId} for user ${lndAggregate.lnd.userEmail}`);
        } else {
            logWarn(`[INIT WALLET restore] Could not update public key for LND with id ${lndAggregate.lnd.lndId} for user ${lndAggregate.lnd.userEmail} because is undefined of some reason! Will try again!`);
        }
    }
};

export const unlockLndAndTryToRestoreFailedInitIfNeeded = async (userEmail: string, lndId: string, password: string): Promise<boolean> => {
    const lndAggregate: LndAggregate | undefined = await findUserActiveLndAggregate(userEmail);
    if (lndAggregate) {
        const unlocked: boolean =  await lndUnlockWallet(lndAggregate.lnd.lndRestAddress, password);
        await tryToRestoreProcessWhichFailedPreviously(lndAggregate);
        return unlocked;
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
    }
    return false;
};
