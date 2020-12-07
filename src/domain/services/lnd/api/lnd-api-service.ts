import axios from 'axios';
import https from 'https';
import { logError } from '../../../../application/logging-service';
import { LndWalletNotInitException } from '../../../model/lnd/api/lnd-wallet-not-init-exception';
import { LndInitWalletDto } from '../../../../interfaces/dto/lnd/lnd-init-wallet-dto';
import { LndLockedException } from '../../../model/lnd/api/lnd-locked-exception';

export const lndGetInfo = async (lndRestAddress: string, macaroonHex: string, tlsCert?: string): Promise<string[] | undefined> => {
    try {
        const httpsAgent = tlsCert ?
            new https.Agent({ ca: [tlsCert!] }) :
            new https.Agent({ rejectUnauthorized: false });
        const res = await axios.get(`${lndRestAddress}/v1/getinfo`, {
            httpsAgent,
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
            timeout: 6000,
        });
        return res.data;
    } catch (err) {
        logError(`Get info of LND with address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }
};

export const lndGenSeed = async (lndRestAddress: string): Promise<string[] | undefined> => {
    try {
        const res = await axios.get(`${lndRestAddress}/v1/genseed`, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        return res.data.cipher_seed_mnemonic;
    } catch (err) {
        logError(`Gen seed for LND with address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }
};

export const lndInitWallet = async (lndRestAddress: string, lndInitWalletDto: LndInitWalletDto): Promise<string | undefined> => {
    try {
        const res = await axios.post(`${lndRestAddress}/v1/initwallet`, {
            wallet_password: new Buffer(lndInitWalletDto.password).toString('base64'),
            cipher_seed_mnemonic: lndInitWalletDto.seedMnemonic,
        }, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        return res.data.admin_macaroon;
    } catch (err) {
        logError(`Init for LND with address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }
};

export const lndUnlockWallet = async (lndRestAddress: string, walletPassword: string): Promise<boolean> => {
    try {
        await axios.post(`${lndRestAddress}/v1/unlockwallet`, {
            wallet_password: Buffer.from(walletPassword).toString('base64'),
        }, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        return true;
    } catch (err) {
        logError(`Unlock for LND with address ${lndRestAddress} failed!`, err.message);
        if (err.response && err.response.data && err.response.data.code === 2) {
            throw new LndWalletNotInitException();
        }
        if (err.response && err.response.status === 404) {
            throw new LndLockedException();
        }
    }
    return false;
};
