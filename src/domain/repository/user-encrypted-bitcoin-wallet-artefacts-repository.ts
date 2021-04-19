import { dbPool } from '../../application/db/db';
import { PoolClient } from 'pg';

export const insertStandardWalletSeedArtefact = async (client: PoolClient, userEmail: string,
                                                       storeId: string, standardWalletSeed: string): Promise<void> => {
    await client.query(`INSERT INTO USER_ENCRYPTED_BITCOIN_WALLET_ARTEFACTS(USER_EMAIL, STORE_ID, STANDARD_WALLET_SEED)
                        VALUES ($1, $2, $3)`,
        [userEmail, storeId, standardWalletSeed]);
};

// TODO it will work well until there is SINGLE store per user, otherwise must be changed
export const findStandardWalletSeedArtefact = async (userEmail: string): Promise<string | undefined> => {
    const result = await dbPool.query(
        `SELECT standard_wallet_seed FROM USER_ENCRYPTED_BITCOIN_WALLET_ARTEFACTS WHERE user_email = $1`, [userEmail]);
    const foundRows = result.rows;
    if (foundRows.length > 1) {
        throw new Error('It should not happen - expected single result from standard wallet seed artefact');
    } else {
        return foundRows.length === 1 ? foundRows[0].standard_wallet_seed : undefined;
    }
};
