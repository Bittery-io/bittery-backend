import { LndCreateException } from '../../model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../../model/lnd/lnd-creation-error-type';
import { UserLndDto } from '../../../interfaces/dto/user-lnd-dto';
import { SaveUserLndDto } from '../../../interfaces/dto/save-user-lnd-dto';
import { getCertThumbprintForExternalLnd } from '../../../application/openssl-service';
import { generateUuid } from '../utils/id-generator-service';
import { CustomLndDto } from '../../../interfaces/dto/custom-lnd-dto';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo, logWarn } from '../../../application/logging-service';
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
import { DigitalOceanLndHosting } from '../../model/lnd/digital-ocean-lnd-hosting';
import { lndGetInfo, lndUnlockWallet } from './api/lnd-api-service';
import { LndWalletNotInitException } from '../../model/lnd/api/lnd-wallet-not-init-exception';
import { LndLockedException } from '../../model/lnd/api/lnd-locked-exception';
import { LndInfo } from '../../model/lnd/api/lnd-info';
import {
    insertLndSetupBacklog,
    lndSetupBacklogExists,
} from '../../repository/lnd/setup-backlog/lnd-setup-backlog-repository';
import { LndSetupBacklog } from '../../model/lnd/setup-backlog/lnd-setup-backlog';
import { insertBilling } from '../../repository/billings-repository';
import { Billing } from '../../model/billings/billing';
import { Product } from '../../model/billings/product';
import { addDays } from '../utils/date-service';
import { BillingStatus } from '../../model/billings/billing-status';
import { formatLndUri } from '../../../application/lnd-connect-service';
import { LndConnectUriDto } from '../../../interfaces/dto/lnd/lnd-connect-uri-dto';
import { findAdminMacaroonArtefact } from '../../repository/user-encrypted-ln-artefacts-repository';

export const createLnd = async (userEmail: string, createLndDto: CreateLndDto): Promise<void> => {
    if (!(await userHasLnd(userEmail))) {
        if (!(await lndSetupBacklogExists(userEmail))) {
            await insertLndSetupBacklog(new LndSetupBacklog(userEmail, new Date().toISOString()));
            const lndId: string = generateUuid();
            const digitalOceanLndHosting: DigitalOceanLndHosting | undefined = await provisionDigitalOceanLnd(userEmail, lndId, createLndDto);
            if (digitalOceanLndHosting) {
                await runInTransaction(async (client: PoolClient) => {
                    await insertLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    await insertBilling(client, new Billing(
                        generateUuid(),
                        userEmail,
                        Product.LND,
                        'PAID_BY_BITTERY',
                        new Date().toISOString(),
                        new Date(addDays(new Date().getTime(), 3)).toISOString(),
                        BillingStatus.PAID));
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
            logWarn(`Starting LND re-setup for user ${userEmail}`);
            // todo przywróć poprzedni proces setupu
        }
    } else {
        throw new LndCreateException(`User ${userEmail} already has LND added!`, LndCreationErrorType.USER_ALREADY_HAS_LND);
    }
};

export const addExternalLnd = async (userEmail: string, saveUserLndDto: SaveUserLndDto): Promise<void> => {
    const lndInfo: LndInfo | undefined = await lndGetInfo(
        saveUserLndDto.lndRestAddress,
        saveUserLndDto.macaroonHex,
        saveUserLndDto.tlsCertFileText);
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
        let rtlAddress: string | undefined = rtl ? `https://${lnd.lndIpAddress}/rtl` : undefined;
        let rtlOneTimeInitPassword: string | undefined = rtl ? rtl.rtlOneTimeInitPassword : undefined;
        const hostedLndType: HostedLndType | undefined = rtl ? HostedLndType.STANDARD : HostedLndType.ENCRYPTED;
        let lndInfo: LndInfo | undefined = undefined;
        let lndStatus: LndStatusEnum = LndStatusEnum.TURNED_OFF;
        let lndUri: string | undefined = undefined;
        if (lnd.macaroonHex) {
            lndInfo = await lndGetInfo(lnd.lndRestAddress, lnd.macaroonHex);
            // if response is not undefined and macaroon is set it means it's off
            if (lndInfo) {
                lndUri = formatLndUri(lndInfo.publicKey, lnd.lndIpAddress);
                lndStatus = LndStatusEnum.RUNNING;
            } else {
                try {
                    await lndUnlockWallet(lnd.lndRestAddress, '');
                } catch (err) {
                    lndStatus = LndStatusEnum.STOPPED;
                    if (err instanceof LndLockedException) {
                        lndStatus = LndStatusEnum.UNLOCK_REQUIRED;
                    }
                }
            }
        } else {
            rtlAddress = undefined;
            rtlOneTimeInitPassword = undefined;
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
        return new UserLndDto(
            lnd.lndId,
            lnd.lndRestAddress,
            lndStatus,
            lnd.lndType,
            lndUri,
            hostedLndType,
            rtlAddress,
            rtlOneTimeInitPassword,
            lndInfo,
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

export const getUserLndConnectUriDetails = async (userEmail: string): Promise<LndConnectUriDto | undefined> => {
    const lnd: Lnd | undefined = await findUserLnd(userEmail);
    if (lnd) {
        const adminMacaroonArtefact: string | undefined = await findAdminMacaroonArtefact(userEmail, lnd.lndId);
        if (adminMacaroonArtefact) {
            return new LndConnectUriDto(
                lnd.lndIpAddress,
                lnd.tlsCert,
                adminMacaroonArtefact,
            );
        } else {
            logError(`Returning user LN connect uri details failed because admin macaroon artefact not found for email ${userEmail} and lnd id ${lnd.lndId}`);
            return undefined;
        }
    }
};
