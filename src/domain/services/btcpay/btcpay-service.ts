import { initializeBtcpayServices, updateLndInStore } from './create/initialize-user-btcpay-service';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import {
    findUserBtcpayDetails,
    insertUserBtcpayDetails,
    userHasBtcpayServices,
} from '../../repository/user-btcpay-details-repository';
import { CreateUserBtcpayException } from './create/create-user-btcpay-exception';
import { CreateUserBtcpayErrorType } from './create/create-user-btcpay-error-type';
import { CreateUserBtcpayDto } from '../../../interfaces/dto/create-user-btcpay-dto';
import { insertUserBitcoinWallet } from '../../repository/user-bitcoin-wallets-repository';
import { UserBitcoinWallet } from '../../model/btc/user-bitcoin-wallet';
import { UserBitcoinWalletTypeEnum } from '../../model/btc/user-bitcoin-wallet-type-enum';
import { getNumberProperty } from '../../../application/property-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo, logWarn } from '../../../application/logging-service';
import { findUserActiveLnd } from '../../repository/lnd/lnds-repository';
import { Lnd } from '../../model/lnd/lnd';
import { insertStandardWalletSeedEncryptedArtefact } from '../../repository/encrypted/user-encrypted-store-artefacts-repository';
import { generateBtcPayCustomLndAddress } from '../lnd/lnd-btcpay-address-generator-service';

export const createUserBtcpayServices = async (userEmail: string, createUserBtcpayDto: CreateUserBtcpayDto): Promise<void> => {
    if (!await userHasBtcpayServices(userEmail)) {
        const lnd: Lnd | undefined = await findUserActiveLnd(userEmail);
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
            await insertUserBtcpayDetails(client, userBtcpayDetails);
            await insertUserBitcoinWallet(client, new UserBitcoinWallet(
                userEmail,
                userBtcpayDetails.storeId,
                masterPublicKey,
                userBitcoinWalletTypeEnum,
                new Date().toDateString(),
            ));
            if (createUserBtcpayDto.encryptedStandardWalletSeed) {
                await insertStandardWalletSeedEncryptedArtefact(
                    client,
                    userEmail,
                    userBtcpayDetails.storeId,
                    createUserBtcpayDto.encryptedStandardWalletSeed);
            }
        });
        logInfo(`Successfully created user btcpay services for user with email ${userEmail}`);
    } else {
        logError(`Failed to create user ${userEmail} BTCPAY services because are already created`);
        throw new CreateUserBtcpayException(`Failed to create user ${userEmail} BTCPAY services because are already created`,
            CreateUserBtcpayErrorType.USER_ALREADY_HAS_BTCPAY);
    }
};

export const updateUserBtcStoreWithActiveLnd = async (userEmail: string): Promise<void> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const lnd: Lnd | undefined = await findUserActiveLnd(userEmail);
        if (lnd) {
            const lndAddress: string = generateBtcPayCustomLndAddress(
                lnd.lndRestAddress,
                lnd.macaroonHex!,
                lnd.tlsCertThumbprint,
            );
            await updateLndInStore(userBtcpayDetails.storeId!, lndAddress);
            logInfo(`Successfully updated LND address in BTCPAY services for active LND for user with email ${userEmail}`);
        } else {
            throw new Error(`Failed to update user ${userEmail} BTCPAY store with new lnd: active lnd not found for this user.`);
        }
    } else {
        logWarn(`Failed to update user ${userEmail} BTCPAY store with new lnd: no BTCPAY found for this user. It's not error - user simply had no BTCPAY.`);
    }
};
