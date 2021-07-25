import { findLndRestAddress, updateLndSetMacaroonHex } from '../../repository/lnd/lnds-repository';
import { lndBakeMacaroonForBtcPay, lndGenSeed, lndInitWallet, lndUnlockWallet } from './api/lnd-api-service';
import { logError, logInfo } from '../../../application/logging-service';
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
        // todo przydałoby się obsłużyć sytuację w której kod poniżej się nie uda
        // todo ponieważ raz zainicjalizowany wallet bez zapisanego hasła to sytuacja stracona
        // todo jak zgubię hasło i zaincjalizuje to potem juz nie mozna tak latwo tego walletu ponownie zainicjalizowac
        // todo w zasadzie jak cos takiego wystąpi to mam po node na ten moment
        let adminMacaroonBase64: string | undefined = await lndInitWallet(lndRestAddress, lndInitWalletDto);
        if (!adminMacaroonBase64) {
            // otherwise it must be downloaded
            const dropletIp: string = await findDropletIp(lndId, userEmail);
            adminMacaroonBase64 = await readAdminMacaroonBase64FromLnd(userEmail, dropletIp);
        }
        await sleep(5000);
        const adminMacaroonHex: string = Buffer.from(adminMacaroonBase64, 'base64').toString('hex');
        const bitteryBakedMacaroonHex: string | undefined = await lndBakeMacaroonForBtcPay(lndRestAddress, adminMacaroonHex);
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
                await updateLndSetMacaroonHex(client, lndId, bitteryBakedMacaroonHex);
                logInfo(`Updated Bittery permissions baked macaroon hex for LND with id ${lndId} for user ${userEmail}`);
            }
        });
        return new LndInitWalletResponseDto(adminMacaroonHex);
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
    }
    return undefined;
};

export const unlockLnd = async (userEmail: string, lndId: string, password: string): Promise<boolean> => {
    const lndRestAddress: string | undefined = await findLndRestAddress(lndId, userEmail);
    if (lndRestAddress) {
        return await lndUnlockWallet(lndRestAddress, password);
    } else {
        logError(`Cannot generate seed for user ${userEmail} and lnd id ${lndId}
                          because matching LND was not found in db!`);
    }
    return false;
};
