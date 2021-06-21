import { dbPool } from '../../../application/db/db';
import { PoolClient } from 'pg';
import { generateUuid } from '../../services/utils/id-generator-service';
import { EncryptedStoreArtefactType } from '../../model/encrypted/encrypted-store-artefact-type';

export const insertStandardWalletSeedEncryptedArtefact = async (client: PoolClient, userEmail: string,
                                                                storeId: string, standardWalletSeed: string): Promise<void> => {
    await client.query(`
                        INSERT INTO USER_ENCRYPTED_STORE_ARTEFACTS(ID, USER_EMAIL, STORE_ID, ENCRYPTED_STORE_ARTEFACT_TYPE, ENCRYPTED_ARTEFACT, CREATION_DATE)
                        VALUES ($1, $2, $3, $4, $5, $6)`,
        [generateUuid(), userEmail, storeId, EncryptedStoreArtefactType.STANDARD_WALLET_SEED,
            standardWalletSeed, new Date().toISOString()]);
};

// TODO it will work well until there is SINGLE store per user, otherwise must be changed
export const findStandardWalletSeedEncryptedArtefact = async (userEmail: string): Promise<string | undefined> => {
    const result = await dbPool.query(
        `SELECT encrypted_artefact FROM USER_ENCRYPTED_STORE_ARTEFACTS WHERE user_email = $1`, [userEmail]);
    const foundRows = result.rows;
    if (foundRows.length > 1) {
        throw new Error('It should not happen - expected single result from STANDARD WALLET SEED encrypted artefact');
    } else {
        return foundRows.length === 1 ? foundRows[0].encrypted_artefact : undefined;
    }
};
