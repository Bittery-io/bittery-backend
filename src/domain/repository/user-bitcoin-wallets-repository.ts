import { dbPool } from '../../application/db/db';
import { UserBitcoinWallet } from '../model/btc/user-bitcoin-wallet';

export const insertUserBitcoinWallet = async (userBitcoinWallet: UserBitcoinWallet): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USER_BITCOIN_WALLETS(USER_EMAIL, STORE_ID, ROOT_PUBLIC_KEY, BIP, CREATION_DATE)
                VALUES ($1, $2, $3, $4, $5)`,
        [userBitcoinWallet.userEmail,
            userBitcoinWallet.storeId,
            userBitcoinWallet.rootPublicKey,
            userBitcoinWallet.bip,
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
            row.bip,
            row.creation_date,
        );
    });
};
