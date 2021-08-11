import { dbPool } from '../../application/db/db';
import { UserBtcpayDetails } from '../model/btcpay/user-btcpay-details';
import { PoolClient } from 'pg';

export const insertUserBtcpayDetails = async (client: PoolClient, userBtcpayDetails: UserBtcpayDetails): Promise<void> => {
    await client.query(`
                INSERT INTO USER_BTCPAY_DETAILS(STORE_ID, API_KEY, user_email)
                VALUES ($1, $2, $3)`,
        [userBtcpayDetails.storeId, userBtcpayDetails.apiKey, userBtcpayDetails.userEmail]);
};

export const userHasBtcpayServices = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(
    SELECT 1 FROM USER_BTCPAY_DETAILS WHERE USER_EMAIL = $1)`, [userEmail]);
    return result.rows[0].exists;
};

export const findUserBtcpayDetails = async (userEmail: string): Promise<UserBtcpayDetails | undefined> => {
    const result = await dbPool.query(`SELECT * FROM USER_BTCPAY_DETAILS WHERE USER_EMAIL = $1`, [userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? new UserBtcpayDetails(
        foundRow.user_email,
        foundRow.store_id,
        foundRow.api_key,
    ) : undefined;
};
