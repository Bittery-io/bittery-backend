import { dbPool } from '../../application/db/db';
import { UserBtcpayDetails } from '../model/btcpay/user-btcpay-details';
import { BtcpayUserAuthToken } from '../model/btcpay/btcpay-user-auth-token';

export const insertUserBtcpayDetails = async (userBtcpayDetails: UserBtcpayDetails): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USER_BTCPAY_DETAILS(STORE_ID, btcpay_user_merchant_token, btcpay_user_private_key, user_email)
                VALUES ($1, $2, $3, $4)`,
        [userBtcpayDetails.storeId,
            userBtcpayDetails.btcpayUserAuthToken.merchantToken,
            userBtcpayDetails.btcpayUserAuthToken.privateKey,
            userBtcpayDetails.userEmail]);
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
        new BtcpayUserAuthToken(
            foundRow.btcpay_user_merchant_token,
            foundRow.btcpay_user_private_key,
        ),
    ) : undefined;
};
