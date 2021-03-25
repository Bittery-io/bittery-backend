import { initializeBtcpayServices } from './create/initialize-user-btcpay-service';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { insertUserBtcpayDetails, userHasBtcpayServices } from '../../repository/user-btcpay-details-repository';
import { CreateUserBtcpayException } from './create/create-user-btcpay-exception';
import { CreateUserBtcpayErrorType } from './create/create-user-btcpay-error-type';
import { CreateUserBtcpayDto } from '../../../interfaces/dto/create-user-btcpay-dto';
import { insertUserBitcoinWallet } from '../../repository/user-bitcoin-wallets-repository';
import { UserBitcoinWallet } from '../../model/btc/user-bitcoin-wallet';
import { UserBitcoinWalletTypeEnum } from '../../model/btc/user-bitcoin-wallet-type-enum';
import { getNumberProperty } from '../../../application/property-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo } from '../../../application/logging-service';
import { findUserLnd } from '../../repository/lnd/lnds-repository';
import { Lnd } from '../../model/lnd/lnd';
import { updateStandardWalletSeedArtefact } from '../../repository/user-encrypted-artefacts-repository';
import { ln } from 'shelljs';

export const createUserBtcpayServices = async (userEmail: string, createUserBtcpayDto: CreateUserBtcpayDto): Promise<void> => {
    if (!await userHasBtcpayServices(userEmail)) {
        const lnd: Lnd | undefined = await findUserLnd(userEmail);
        if (!lnd) {
            // todo obsluga bledu lepsza
            throw new Error('User has not lnd yet');
        }
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
            userEmail, masterPublicKey, getNumberProperty('BTCPAY_PAYMENT_EXPIRATION_MINUTES'), lnd);
        await runInTransaction(async (client: PoolClient) => {
            if (createUserBtcpayDto.encryptedStandardWalletSeed) {
                await updateStandardWalletSeedArtefact(userEmail, lnd.lndId, createUserBtcpayDto.encryptedStandardWalletSeed);
            }
            await insertUserBtcpayDetails(client, userBtcpayDetails);
            await insertUserBitcoinWallet(client, new UserBitcoinWallet(
                userEmail,
                userBtcpayDetails.storeId,
                masterPublicKey,
                userBitcoinWalletTypeEnum,
                new Date().toDateString(),
            ));
        });
        logInfo(`Successfully created user btcpay services for user with email ${userEmail}`);
    } else {
        logError(`Failed to create user ${userEmail} BTCPAY services because are already created`);
        throw new CreateUserBtcpayException(`Failed to create user ${userEmail} BTCPAY services because are already created`,
            CreateUserBtcpayErrorType.USER_ALREADY_HAS_BTCPAY);
    }
};
