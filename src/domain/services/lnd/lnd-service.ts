import { findLndRestAddress, updateLndSetMacaroonHex } from '../../repository/lnd/lnds-repository';
import { lndBakeMacaroonForBtcPay, lndGenSeed, lndInitWallet, lndUnlockWallet } from './api/lnd-api-service';
import { logError, logInfo } from '../../../application/logging-service';
import { LndInitWalletDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-dto';
import { LndInitWalletResponseDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-response-dto';
import { inserUserEncryptedArtefacts } from '../../repository/user-encrypted-artefacts-repository';
import { UserEncryptedArtefacts } from '../../model/user/user-encrypted-artefacts';
import { sleep } from '../utils/sleep-service';

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
        const adminMacaroon: string | undefined = await lndInitWallet(lndRestAddress, lndInitWalletDto);
        if (adminMacaroon) {
            await inserUserEncryptedArtefacts(new UserEncryptedArtefacts(
                userEmail, lndId, adminMacaroon,
            ));
            await sleep(5000);
            const bitteryBakedMacaroonHex: string | undefined =
                await lndBakeMacaroonForBtcPay(lndRestAddress, Buffer.from(adminMacaroon, 'base64').toString('hex'));
            if (bitteryBakedMacaroonHex) {
                await updateLndSetMacaroonHex(lndId, bitteryBakedMacaroonHex);
                logInfo(`Updated Bittery permissions baked macaroon hex for LND with id ${lndId} for user ${userEmail}`);
            }
            return new LndInitWalletResponseDto(adminMacaroon);
        }
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
