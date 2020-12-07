import { LndCreateException } from '../../model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../../model/lnd/lnd-creation-error-type';
import { UserLndDto } from '../../../interfaces/dto/user-lnd-dto';
import { SaveUserLndDto } from '../../../interfaces/dto/save-user-lnd-dto';
import { getCertThumbprintForExternalLnd } from '../../../application/openssl-service';
import { generateUuid } from '../utils/id-generator-service';
import { CustomLndDto } from '../../../interfaces/dto/custom-lnd-dto';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo } from '../../../application/logging-service';
import { CreateLndDto } from '../../../interfaces/dto/lnd/create-lnd-dto';
import { provisionDigitalOceanLnd } from './provisioning/digital-ocean-lnd-provision-service';
import { findUserLnd, insertLnd, userHasLnd } from '../../repository/lnd/lnds-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { insertHostedLnd } from '../../repository/lnd/lnd-hosted-repository';
import { insertDigitalOceanLnd } from '../../repository/lnd/digital-ocean-lnds-repository';
import { findRtl, insertUserRtl } from '../../repository/lnd/rtls-repository';
import { Lnd } from '../../model/lnd/lnd';
import { LndType } from '../../model/lnd/lnd-type';
import { Rtl } from '../../model/lnd/hosted/rtl/rtl';
import { LndStatusEnum } from '../../model/lnd/lnd-status-enum';
import { getLndConnectUri } from './lnd-zap-connection-uri-service';
import { DigitalOceanLndHosting } from '../../model/lnd/digital-ocean-lnd-hosting';
import { lndGetInfo, lndUnlockWallet } from './api/lnd-api-service';
import { getLndUrl } from '../../../application/lnd-connect-service';
import { LndWalletNotInitException } from '../../model/lnd/api/lnd-wallet-not-init-exception';
import { LndLockedException } from '../../model/lnd/api/lnd-locked-exception';

export const createLnd = async (userEmail: string, createLndDto: CreateLndDto): Promise<void> => {
    if (!(await userHasLnd(userEmail))) {
        const lndId: string = generateUuid();
        const digitalOceanLndHosting: DigitalOceanLndHosting | undefined = await provisionDigitalOceanLnd(userEmail, lndId, createLndDto);
        if (digitalOceanLndHosting) {
            await runInTransaction(async (client: PoolClient) => {
                await insertLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                if (createLndDto.hostedLndType === HostedLndType.STANDARD) {
                    await insertHostedLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    await insertUserRtl(client, digitalOceanLndHosting.rtl!);
                    await insertDigitalOceanLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                } else {
                    await insertHostedLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    await insertDigitalOceanLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                }
            });
        }
    } else {
        throw new LndCreateException(`User ${userEmail} already has LND added!`, LndCreationErrorType.USER_ALREADY_HAS_LND);
    }
};

export const addExternalLnd = async (userEmail: string, saveUserLndDto: SaveUserLndDto): Promise<void> => {
    const lndInfo: any | undefined = await lndGetInfo(saveUserLndDto.macaroonHex,
        saveUserLndDto.lndRestAddress, saveUserLndDto.tlsCertFileText);
    logInfo(`Successfully connected to user custom LND node address: ${saveUserLndDto.lndRestAddress}`);
    if (lndInfo) {
        const lndId: string = generateUuid();
        const tlsCertThumbprint: string = await getCertThumbprintForExternalLnd(userEmail, saveUserLndDto.tlsCertFileText);
        await runInTransaction(async (client: PoolClient) => {
            await insertLnd(client, new Lnd(
                lndId,
                userEmail,
                'lnd address todo',
                saveUserLndDto.lndRestAddress,
                saveUserLndDto.tlsCertFileText,
                tlsCertThumbprint,
                lndInfo.version,
                LndType.EXTERNAL,
                saveUserLndDto.macaroonHex,
            ));
        });
        logInfo(`Saved external LND with id ${lndId} for user ${userEmail}`);
    } else {
        throw new LndCreateException(`Cannot add user ${userEmail} LND because getting node info failed.`,
            LndCreationErrorType.GETTING_LND_INFO_FAILED);
    }
};

export const getUserLnd = async (userEmail: string): Promise<UserLndDto | undefined> => {
    const lnd: Lnd | undefined = await findUserLnd(userEmail);
    if (lnd) {
        const rtl: Rtl | undefined = lnd.lndType === LndType.HOSTED ? (await findRtl(lnd.lndId)) : undefined;
        let lndUrl: string | undefined = undefined;
        let lndConnectUri: string | undefined = undefined;
        let lndStatus: LndStatusEnum = LndStatusEnum.TURNED_OFF;
        if (lnd.macaroonHex) {
            lndUrl = await getLndUrl(lnd.macaroonHex, lnd.lndRestAddress);
            lndConnectUri = await getLndConnectUri(lnd.lndAddress, lnd.tlsCert, lnd.macaroonHex);
            // if response is not undefined and macaroon is set it means it's off
            if (lndUrl) {
                lndStatus = LndStatusEnum.STOPPED;
            } else {
                lndStatus = LndStatusEnum.WORKING;
            }
        } else {
            try {
                await lndUnlockWallet(lnd.lndRestAddress, '');
            } catch (err) {
                if (err instanceof LndWalletNotInitException) {
                    lndStatus = LndStatusEnum.INIT_REQUIRED;
                }
                if (err instanceof LndLockedException) {
                    lndStatus = LndStatusEnum.UNLOCK_REQUIRED;
                }
            }
        }
        // const lndStatus: LndStatusEnum = lndUrl ? LndStatusEnum.WORKING : LndStatusEnum.STOPPED;
        const hostedLndType: HostedLndType | undefined = rtl ? HostedLndType.STANDARD : HostedLndType.ENCRYPTED;
        return new UserLndDto(
            lnd.lndId,
            lnd.lndRestAddress,
            lndStatus,
            lnd.lndType,
            hostedLndType,
            lndUrl,
            lndConnectUri,
            rtl ? `https://${lnd.lndAddress}/rtl` : undefined,
            rtl ? rtl.rtlOneTimeInitPassword : undefined,
        );
    } else {
        logError(`Cannot return user lnd for user ${userEmail} because has no LND added in Bittery!`);
        return undefined;
    }
};

export const getCustomUserLnd = async (userEmail: string): Promise<CustomLndDto | undefined> => {
    // const customLnd: Lnd | undefined = await findCustomLnd(userEmail);
    // if (customLnd) {
    //     const lndUrl: string | undefined = await getLndUrl(customLnd.macaroonHex, customLnd.lndRestAddress, customLnd.tlsCert);
    //     const lndStatus: LndStatusEnum = lndUrl ? LndStatusEnum.WORKING : LndStatusEnum.STOPPED;
    //     return new CustomLndDto(
    //         customLnd.lndRestAddress,
    //         customLnd.macaroonHex,
    //         customLnd.tlsCert,
    //         lndUrl ? lndUrl : 'Connection to node failed.',
    //         lndStatus,
    //     );
    // } else {
    //     logError(`Cannot return custom lnd for user ${userEmail} because has no custom lnd!`);
    //     return undefined;
    // }
    // todo zrobic
    return undefined;
};
