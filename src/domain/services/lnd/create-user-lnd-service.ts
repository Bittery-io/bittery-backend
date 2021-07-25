import { LndCreateException } from '../../model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../../model/lnd/lnd-creation-error-type';
import { UserLndDto } from '../../../interfaces/dto/user-lnd-dto';
import { SaveExternalLndDto } from '../../../interfaces/dto/save-external-lnd-dto';
import { getCertThumbprintForExternalLnd } from '../../../application/openssl-service';
import { generateUuid } from '../utils/id-generator-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo, logWarn } from '../../../application/logging-service';
import { CreateLndDto } from '../../../interfaces/dto/lnd/create-lnd-dto';
import { provisionDigitalOceanLnd } from './provisioning/digital-ocean-lnd-provision-service';
import { findUserLnd, insertLnd, userHasLnd } from '../../repository/lnd/lnds-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { insertHostedLnd } from '../../repository/lnd/lnd-hosted-repository';
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
import { insertBilling } from '../../repository/lnd-billings-repository';
import { LndBilling } from '../../model/billings/lnd-billing';
import { addDays } from '../utils/date-service';
import { BillingStatus } from '../../model/billings/billing-status';
import { LndConnectUriDto } from '../../../interfaces/dto/lnd/lnd-connect-uri-dto';
import { findAdminMacaroonHexEncryptedArtefact } from '../../repository/encrypted/user-encrypted-ln-artefacts-repository';
import { findDropletIp, insertDigitalOceanLnd } from '../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';

export const createLnd = async (userEmail: string, createLndDto: CreateLndDto): Promise<void> => {
    if (!(await userHasLnd(userEmail))) {
        if (!(await lndSetupBacklogExists(userEmail))) {
            await insertLndSetupBacklog(new LndSetupBacklog(userEmail, new Date().toISOString()));
            const lndId: string = generateUuid();
            const digitalOceanLndHosting: DigitalOceanLndHosting | undefined = await provisionDigitalOceanLnd(userEmail, lndId, createLndDto);
            if (digitalOceanLndHosting) {
                await runInTransaction(async (client: PoolClient) => {
                    await insertLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    await insertBilling(client, new LndBilling(
                        generateUuid(),
                        userEmail,
                        lndId,
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

export const addExternalLnd = async (userEmail: string, saveUserLndDto: SaveExternalLndDto): Promise<void> => {
    const lndInfo: LndInfo | undefined = await lndGetInfo(
        saveUserLndDto.lndRestAddress,
        saveUserLndDto.macaroonHex);
    if (lndInfo) {
        logInfo(`Successfully connected to user external LND node address: ${saveUserLndDto.lndRestAddress}`);
        const lndId: string = generateUuid();
        const tlsCertThumbprint: string = await getCertThumbprintForExternalLnd(userEmail, saveUserLndDto.tlsCertFileText);
        await runInTransaction(async (client: PoolClient) => {
            await insertLnd(client, new Lnd(
                lndId,
                userEmail,
                saveUserLndDto.lndRestAddress,
                saveUserLndDto.tlsCertFileText,
                tlsCertThumbprint,
                lndInfo.version,
                LndType.EXTERNAL,
                new Date().toISOString(),
                true,
                saveUserLndDto.macaroonHex,
            ));
        });
        logInfo(`Saved external LND with id ${lndId} for user ${userEmail}`);
    } else {
        throw new LndCreateException(`Cannot add user ${userEmail} external LND because getting node info failed.`,
            LndCreationErrorType.GETTING_LND_INFO_FAILED);
    }
};

export const getUserLnd = async (userEmail: string): Promise<UserLndDto | undefined> => {
    const lnd: Lnd | undefined = await findUserLnd(userEmail);
    if (lnd) {
        if (lnd.lndType === LndType.HOSTED) {
            // todo maybe fetch it in single sql would be best
            const dropletIp: string = await findDropletIp(lnd.lndId, userEmail);
            const rtl: Rtl | undefined = await findRtl(lnd.lndId);
            let rtlAddress: string | undefined = rtl ? `https://${dropletIp}/rtl` : undefined;
            let rtlOneTimeInitPassword: string | undefined = rtl ? rtl.rtlOneTimeInitPassword : undefined;
            const hostedLndType: HostedLndType | undefined = rtl ? HostedLndType.STANDARD : HostedLndType.ENCRYPTED;
            let lndInfo: LndInfo | undefined = undefined;
            let lndStatus: LndStatusEnum = LndStatusEnum.TURNED_OFF;
            let lndUri: string | undefined = undefined;
            if (lnd.macaroonHex) {
                lndInfo = await lndGetInfo(lnd.lndRestAddress, lnd.macaroonHex);
                // if response is not undefined and macaroon is set it means it's off
                if (lndInfo) {
                    lndUri = lndInfo.uri;
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
        } else if (lnd.lndType === LndType.EXTERNAL) {
            let lndInfo: LndInfo | undefined = undefined;
            let lndStatus: LndStatusEnum = LndStatusEnum.TURNED_OFF;
            let lndUri: string | undefined = undefined;
            if (lnd.macaroonHex) {
                lndInfo = await lndGetInfo(lnd.lndRestAddress, lnd.macaroonHex);
                // if response is not undefined and macaroon is set it means it's off
                if (lndInfo) {
                    lndUri = lndInfo.uri;
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
            }
            return new UserLndDto(
                lnd.lndId,
                lnd.lndRestAddress,
                lndStatus,
                LndType.EXTERNAL,
                lndUri,
                undefined,
                undefined,
                undefined,
                lndInfo,
            );
        }

    } else {
        logError(`Cannot return user lnd for user ${userEmail} because has no LND added in Bittery!`);
        return undefined;
    }
};

export const getUserLndConnectUriDetails = async (userEmail: string): Promise<LndConnectUriDto | undefined> => {
    const lnd: Lnd | undefined = await findUserLnd(userEmail);
    if (lnd) {
        const dropletIp: string = await findDropletIp(lnd.lndId, userEmail);
        const adminMacaroonArtefact: string | undefined = await findAdminMacaroonHexEncryptedArtefact(userEmail, lnd.lndId);
        if (adminMacaroonArtefact) {
            return new LndConnectUriDto(
                dropletIp,
                lnd.tlsCert,
                adminMacaroonArtefact,
            );
        } else {
            logError(`Returning user LN connect uri details failed because LND with id ${lnd.lndId} was not found for user ${userEmail}`);
            return undefined;
        }
    }
};
