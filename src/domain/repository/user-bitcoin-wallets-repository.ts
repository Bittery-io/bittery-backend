import { dbPool } from '../../application/db/db';
import { UserBitcoinWallet } from '../model/btc/user-bitcoin-wallet';
import { PoolClient } from 'pg';

export const insertUserBitcoinWallet = async (client: PoolClient, userBitcoinWallet: UserBitcoinWallet): Promise<void> => {
    await client.query(`
                INSERT INTO USER_BITCOIN_WALLETS(USER_EMAIL, STORE_ID, ROOT_PUBLIC_KEY, TYPE, CREATION_DATE)
                VALUES ($1, $2, $3, $4, $5)`,
        [userBitcoinWallet.userEmail,
            userBitcoinWallet.storeId,
            userBitcoinWallet.rootPublicKey,
            userBitcoinWallet.type,
            userBitcoinWallet.creationDate]);
};

export const findUserBitcoinWallets = async (userEmail: string): Promise<UserBitcoinWallet[]> => {
    const result = await dbPool.query(`SELECT * FROM USER_BITCOIN_WALLETS WHERE user_email = $1`, [userEmail]);
    const foundRows = result.rows;
    return foundRows.map((row) => {
        return new UserBitcoinWallet(
            row.user_email,
            row.store_id,
            row.root_public_key,
            row.type,
            row.creation_date,
        );
    });
};
