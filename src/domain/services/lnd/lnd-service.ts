import { findLndRestAddress } from '../../repository/lnd/lnds-repository';
import { lndGenSeed, lndInitWallet, lndUnlockWallet } from './api/lnd-api-service';
import { logError } from '../../../application/logging-service';
import { LndInitWalletDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-dto';
import { LndInitWalletResponseDto } from '../../../interfaces/dto/lnd/lnd-init-wallet-response-dto';
import { inserUserEncryptedArtefacts } from '../../repository/user-encrypted-artefacts-repository';
import { UserEncryptedArtefacts } from '../../model/user/user-encrypted-artefacts';

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
