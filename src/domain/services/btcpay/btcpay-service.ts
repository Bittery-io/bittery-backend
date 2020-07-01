import { initializeBtcpayServices } from './create/initialize-user-btcpay-service';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { userHasBtcpayServices, insertUserBtcpayDetails } from '../../repository/user-btcpay-details-repository';
import { CreateUserBtcpayException } from './create/create-user-btcpay-exception';
import { CreateUserBtcpayErrorType } from './create/create-user-btcpay-error-type';
import { CreateUserBtcpayDto } from '../../../interfaces/dto/create-user-btcpay-dto';
import { insertUserBitcoinWallet } from '../../repository/user-bitcoin-wallets-repository';
import { UserBitcoinWallet } from '../../model/btc/user-bitcoin-wallet';
import { findUserDomain } from '../../repository/user-domains-repository';
import { UserDomain } from '../../model/lnd/user-domain';
import { getDevelopmentHostName, isDevelopmentEnv } from '../../../application/property-utils-service';
import { findCustomLnd } from '../../repository/custom-lnds-repository';
import { CustomLnd } from '../../model/lnd/custom-lnd';

export const createUserBtcpayServices = async (userEmail: string, createUserBtcpayDto: CreateUserBtcpayDto): Promise<void> => {
    if (!await userHasBtcpayServices(userEmail)) {
        const userDomain: UserDomain | undefined = await findUserDomain(userEmail);
        let userDomainName: string;
        if (isDevelopmentEnv()) {
            userDomainName = getDevelopmentHostName();
        } else {
            userDomainName = userDomain!.userDomain;
        }
        const customLnd: CustomLnd | undefined = await findCustomLnd(userEmail);
        const userBtcpayDetails: UserBtcpayDetails = await initializeBtcpayServices(
            userEmail, userDomainName!, createUserBtcpayDto.bip49RootPublicKey, customLnd);
        await insertUserBtcpayDetails(userBtcpayDetails);
        await insertUserBitcoinWallet(new UserBitcoinWallet(
            userEmail,
            userBtcpayDetails.storeId,
            createUserBtcpayDto.bip49RootPublicKey,
            'bip49',
            new Date().toDateString(),
        ));
        console.log(`Successfully created user btcpay services for user with email ${userEmail}`);
    } else {
        console.log(`Successfully created user btcpay services for user with email ${userEmail}`);
        throw new CreateUserBtcpayException('Failed to create user BTCPAY services because are already created',
            CreateUserBtcpayErrorType.USER_ALREADY_HAS_BTCPAY);
    }
};
