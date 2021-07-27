import { dbPool } from '../../../application/db/db';
import { PoolClient } from 'pg';
import { UserEncryptedLnArtefact } from '../../model/encrypted/user-encrypted-ln-artefact';
import { EncryptedLnArtefactType } from '../../model/encrypted/encrypted-ln-artefact-type';

export const insertUserEncryptedLnArtefacts = async (client: PoolClient, userEncryptedArtefacts: UserEncryptedLnArtefact[]): Promise<void> => {
    const ids: string[] = [];
    const userEmails: string[] = [];
    const lndIds: string[] = [];
    const encryptedLnArtefactTypes: EncryptedLnArtefactType[] = [];
    const encryptedArtefacts: string[] = [];
    const creationDates: string[] = [];
    userEncryptedArtefacts.forEach((_) => {
        ids.push(_.id);
        userEmails.push(_.userEmail);
        lndIds.push(_.lndId);
        creationDates.push(_.creationDate);
        encryptedLnArtefactTypes.push(_.encryptedLnArtefactType);
        encryptedArtefacts.push(_.encryptedArtefact);
    });
    await client.query(`
        INSERT INTO USER_ENCRYPTED_LN_ARTEFACTS(ID, USER_EMAIL, LND_ID, ENCRYPTED_LN_ARTEFACT_TYPE, ENCRYPTED_ARTEFACT, CREATION_DATE)
        SELECT fs.id, fs.user_email, fs.lnd_id, fs.encrypted_ln_artefact_type, fs.encrypted_artefact, fs.creation_date
        FROM UNNEST($1::uuid[], $2::text[], $3::uuid[], $4::text[], $5::text[], $6::timestamp[])
        WITH ORDINALITY AS fs(id, user_email, lnd_id, encrypted_ln_artefact_type, encrypted_artefact, creation_date)`,
        [ids, userEmails, lndIds, encryptedLnArtefactTypes, encryptedArtefacts, creationDates]);
};

export const updateAdminMacaroonHexEncryptedArtefact = async (userEmail: string, lndId: string, adminMacaroonHex: string): Promise<void> => {
    await dbPool.query(`UPDATE USER_ENCRYPTED_LN_ARTEFACTS
                        SET ENCRYPTED_ARTEFACT = $1
                        WHERE USER_EMAIL = $2
                        AND LND_ID = $3
                        AND ENCRYPTED_LN_ARTEFACT_TYPE = $4`,
        [adminMacaroonHex, userEmail, lndId, EncryptedLnArtefactType.ADMIN_MACAROON_HEX]);
};

export const findAdminMacaroonHexEncryptedArtefact = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT ENCRYPTED_ARTEFACT FROM USER_ENCRYPTED_LN_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2
                        AND ENCRYPTED_LN_ARTEFACT_TYPE = $3`,
        [userEmail, lndId, EncryptedLnArtefactType.ADMIN_MACAROON_HEX]);
    return result.rows.length === 1 ? result.rows[0].encrypted_artefact : undefined;
};

export const findLnPasswordEncryptedArtefact = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT ENCRYPTED_ARTEFACT FROM USER_ENCRYPTED_LN_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2
                        AND ENCRYPTED_LN_ARTEFACT_TYPE = $3`,
        [userEmail, lndId, EncryptedLnArtefactType.LN_PASSWORD]);
    return result.rows.length === 1 ? result.rows[0].encrypted_artefact : undefined;
};

export const findUserEncryptedLnArtefacts = async (userEmail: string, lndId: string): Promise<UserEncryptedLnArtefact[]> => {
    const result = await dbPool.query(`
                        SELECT ID, USER_EMAIL, LND_ID, encrypted_ln_artefact_type, encrypted_artefact, creation_date
                        FROM USER_ENCRYPTED_LN_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2`,
        [userEmail, lndId]);
    return result.rows.map(row => new UserEncryptedLnArtefact(
        row.id,
        userEmail,
        lndId,
        row.encrypted_ln_artefact_type,
        row.encrypted_artefact,
        row.creation_date,
    ));
};

// todo IT WILL WORK UNTIL THERE IS SINGLE LND PER USER
export const findLnSeedMnemonicEncryptedArtefact = async (userEmail: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT ENCRYPTED_ARTEFACT FROM USER_ENCRYPTED_LN_ARTEFACTS
                            WHERE USER_EMAIL = $1
                            AND ENCRYPTED_LN_ARTEFACT_TYPE = $2`,
        [userEmail, EncryptedLnArtefactType.LN_SEED_MNEMONIC]);
    return result.rows.length === 1 ? result.rows[0].encrypted_artefact : undefined;
};
