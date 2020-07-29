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
import { UserBitcoinWalletTypeEnum } from '../../model/btc/user-bitcoin-wallet-type-enum';
import { getNumberProperty } from '../../../application/property-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';

export const createUserBtcpayServices = async (userEmail: string, createUserBtcpayDto: CreateUserBtcpayDto): Promise<void> => {
    if (!await userHasBtcpayServices(userEmail)) {
        const userDomain: UserDomain | undefined = await findUserDomain(userEmail);
        const userDomainName: string = isDevelopmentEnv() ? getDevelopmentHostName() : userDomain!.userDomain;
        const customLnd: CustomLnd | undefined = await findCustomLnd(userEmail);
        if (!createUserBtcpayDto.bip49RootPublicKey && !createUserBtcpayDto.electrumMasterPublicKey) {
            throw new CreateUserBtcpayException(`Failed to create user ${userEmail} BTCPAY services because no master public key provided`,
                CreateUserBtcpayErrorType.NO_MASTER_PUBLIC_KEY_PROVIDED);
        }
        const masterPublicKey: string = createUserBtcpayDto.bip49RootPublicKey ?
            createUserBtcpayDto.bip49RootPublicKey! :
            createUserBtcpayDto.electrumMasterPublicKey!;
        const userBitcoinWalletTypeEnum: UserBitcoinWalletTypeEnum = createUserBtcpayDto.bip49RootPublicKey ?
            UserBitcoinWalletTypeEnum.BIP_49 :
            UserBitcoinWalletTypeEnum.ELECTRUM;
        const userBtcpayDetails: UserBtcpayDetails = await initializeBtcpayServices(
            userEmail, userDomainName!, masterPublicKey, getNumberProperty('BTCPAY_PAYMENT_EXPIRATION_MINUTES'), customLnd);
        await runInTransaction(async (client: PoolClient) => {
            await insertUserBtcpayDetails(client, userBtcpayDetails);
            await insertUserBitcoinWallet(client, new UserBitcoinWallet(
                userEmail,
                userBtcpayDetails.storeId,
                masterPublicKey,
                userBitcoinWalletTypeEnum,
                new Date().toDateString(),
            ));
        });
        console.log(`Successfully created user btcpay services for user with email ${userEmail}`);
    } else {
        console.log(`Successfully created user btcpay services for user with email ${userEmail}`);
        throw new CreateUserBtcpayException(`Failed to create user ${userEmail} BTCPAY services because are already created`,
            CreateUserBtcpayErrorType.USER_ALREADY_HAS_BTCPAY);
    }
};
