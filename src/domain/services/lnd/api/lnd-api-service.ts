import axios from 'axios';
import https from 'https';
import { logError } from '../../../../application/logging-service';
import { LndWalletNotInitException } from '../../../model/lnd/api/lnd-wallet-not-init-exception';
import { LndInitWalletDto } from '../../../../interfaces/dto/lnd/lnd-init-wallet-dto';
import { LndLockedException } from '../../../model/lnd/api/lnd-locked-exception';
import { LndInfo } from '../../../model/lnd/api/lnd-info';
import { Lnd } from '../../../model/lnd/lnd';

export const lndGetInfo = async (lndRestAddress: string, macaroonHex: string): Promise<LndInfo | undefined> => {
    try {
        // tslint:disable-next-line:no-parameter-reassignment
        // tlsCert = undefined;
        // todo tu mam podejrzenie ze nigdy nie jest ten cert przekazywany
        // w ogole jak jest przekazany przy external LND to nie dziala...
        // dziala tylko jak jest undefined
        // const httpsAgent = tlsCert ?
        //     new https.Agent({ ca: [tlsCert!] }) :
        //     new https.Agent({ rejectUnauthorized: false });
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const res = await axios.get(`${lndRestAddress}/v1/getinfo`, {
            httpsAgent,
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
            timeout: 6000,
        });
        return new LndInfo(
            res.data.identity_pubkey,
            res.data.synced_to_chain,
            res.data.synced_to_graph,
            res.data.num_peers,
            res.data.num_inactive_channels,
            res.data.num_active_channels,
            res.data.num_pending_channels,
            res.data.version,
            res.data.uris[0],
            res.data.alias,
        );
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
            wallet_password: Buffer.from(lndInitWalletDto.password).toString('base64'),
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

export const lndBakeMacaroonForBtcPay = async (lndRestAddress: string, macaroonHex: string): Promise<string | undefined> => {
    try {
        const res = await axios.post(`${lndRestAddress}/v1/macaroon`, {
            permissions: [
                { entity: 'info', action: 'read' },
                { entity: 'invoices', action: 'read' },
                { entity: 'invoices', action: 'write' },
                { entity: 'offchain', action: 'read' },
            ],
        }, {
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        return res.data.macaroon;
    } catch (err) {
        logError(`Bake macaroon for LND with address ${lndRestAddress} failed!`, err.message);
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
        if (err.response && err.response.data && err.response.data.code === 2 &&
                err.response.data.message === 'invalid passphrase for master public key') {
            throw new LndLockedException();
        }
        if (err.response && err.response.data && err.response.data.code === 2) {
            throw new LndWalletNotInitException();
        }
        if (err.response && err.response.status === 404) {
            throw new LndLockedException();
        }
    }
    return false;
};

// returns base64 string
export const getAllStaticChannelBackupBase64 = async (lndRestAddress: string, macaroonHex: string): Promise<string> => {
    try {
        const res = await axios.get(`${lndRestAddress}/v1/channels/backup`, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
        });
        return Buffer.from(JSON.stringify(res.data.multi_chan_backup)).toString('base64');
    } catch (err) {
        logError(`Getting static channel backup for LND with address ${lndRestAddress} failed!`, err.message);
        throw err;
    }
};

export const restoreStaticChannelBackup = async (lndRestAddress: string, macaroonHex: string): Promise<string | undefined> => {
    try {
        const res = await axios.get(`${lndRestAddress}/v1/channels/backup`, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
        });
        // const res2 = await axios.post(`${lndRestAddress}/v1/channels/backup/restore`, {
        //     multi_chan_backup: res.data.multi_chan_backup.multi_chan_backup,
        // }, {
        //     httpsAgent: new https.Agent({
        //         rejectUnauthorized: false,
        //     }),
        //     headers: {
        //         'Grpc-Metadata-macaroon': macaroonHex,
        //     },
        // });
        return res.data.multi_chan_backup;
    } catch (err) {
        logError(`Getting static channel backup for LND with address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }
};
