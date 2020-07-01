import { BtcpayUserAuthToken } from '../../../model/btcpay/btcpay-user-auth-token';
import { getProperty } from '../../../../application/property-service';
const btcpay = require('btcpay');

export const generateApiToken = async (btcpayPaircode: string): Promise<BtcpayUserAuthToken> => {
    const keyPair = btcpay.crypto.generate_keypair();
    const rest: any = await new btcpay.BTCPayClient(getProperty('BTCPAY_URL'), keyPair).pair_client(btcpayPaircode);
    return new BtcpayUserAuthToken(
        rest.merchant,
        keyPair.getPrivate().toString('hex'),
    );
};
