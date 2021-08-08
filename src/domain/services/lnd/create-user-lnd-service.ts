import { LndCreateException } from '../../model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../../model/lnd/lnd-creation-error-type';
import { SaveExternalLndDto } from '../../../interfaces/dto/save-external-lnd-dto';
import { getCertThumbprintForExternalLnd } from '../../../application/openssl-service';
import { generateUuid } from '../utils/id-generator-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo, logWarn } from '../../../application/logging-service';
import { CreateLndDto } from '../../../interfaces/dto/lnd/create-lnd-dto';
import { provisionDigitalOceanLnd } from './provisioning/digital-ocean-lnd-provision-service';
import {
    findUserActiveLnd,
    findUserLndAggregatesNewestFirst,
    insertLnd,
    userHasLnd,
} from '../../repository/lnd/lnds-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { insertHostedLnd } from '../../repository/lnd/lnd-hosted-repository';
import { insertUserRtl } from '../../repository/lnd/rtls-repository';
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
    deleteLndSetupBacklog,
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
import { LndAggregate } from '../../model/lnd/lnd-aggregate';
import { ExpiredUserLndDto } from '../../../interfaces/dto/lnd/expired-user-lnd-dto';
import { UserLndDto } from '../../../interfaces/dto/lnd/user-lnd-dto';
import { UserLndsDto } from '../../../interfaces/dto/lnd/user-lnds-dto';
import { findDigitalOceanArchive } from '../../repository/lnd/digital-ocean/digital-ocean-archives-repository';
import { DigitalOceanArchive } from '../../model/lnd/digital-ocean-archive';

export const createLnd = async (userEmail: string, createLndDto: CreateLndDto): Promise<void> => {
    if (!(await userHasLnd(userEmail))) {
        if (!(await lndSetupBacklogExists(userEmail))) {
            await insertLndSetupBacklog(new LndSetupBacklog(userEmail, new Date().toISOString()));
            const lndId: string = generateUuid();
            const digitalOceanLndHosting: DigitalOceanLndHosting | undefined = await provisionDigitalOceanLnd(userEmail, lndId, createLndDto);
            if (digitalOceanLndHosting) {
                await runInTransaction(async (client: PoolClient) => {
                    await deleteLndSetupBacklog(userEmail, client);
                    await insertLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    await insertBilling(client, new LndBilling(
                        generateUuid(),
                        userEmail,
                        lndId,
                        'PAID_BY_BITTERY',
                        new Date().toISOString(),
                        BillingStatus.PAID,
                        0,
                        new Date(addDays(new Date().getTime(), 3)).toISOString(),
                    ));
                    if (createLndDto.hostedLndType === HostedLndType.STANDARD) {
                        await insertHostedLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                        await insertUserRtl(client, digitalOceanLndHosting.rtl!);
                        await insertDigitalOceanLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    } else {
                        await insertHostedLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                        await insertDigitalOceanLnd(client, digitalOceanLndHosting.digitalOceanLnd);
                    }
                });
            } else {
                logWarn(`Create LND for user ${userEmail} failed - no digital ocean LND. Removing SETUP BACKLOG entry for user.`);
                await deleteLndSetupBacklog(userEmail);
            }
        } else {
            logError(`Oops user ${userEmail} request another CREATE LN while current is already running - so returning error (ignoring)`);
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

export const getUserLnds = async (userEmail: string): Promise<UserLndsDto | undefined> => {
    const lndAggregates: LndAggregate[] = await findUserLndAggregatesNewestFirst(userEmail);
    if (lndAggregates.length > 0) {
        const activeLndAggregate: LndAggregate | undefined = lndAggregates.filter(_ => _.lnd.isActive)[0];
        if (activeLndAggregate) {
            if (activeLndAggregate.lnd.lndType === LndType.HOSTED) {
                const dropletIp: string = activeLndAggregate.digitalOceanLnd?.dropletIp!;
                const rtl: Rtl | undefined = activeLndAggregate.rtl;
                let rtlAddress: string | undefined = rtl ? `https://${dropletIp}/rtl` : undefined;
                let rtlOneTimeInitPassword: string | undefined = rtl ? rtl.rtlOneTimeInitPassword : undefined;
                const hostedLndType: HostedLndType | undefined = rtl ? HostedLndType.STANDARD : HostedLndType.ENCRYPTED;
                let lndInfo: LndInfo | undefined = undefined;
                let lndStatus: LndStatusEnum = LndStatusEnum.TURNED_OFF;
                let lndUri: string | undefined = undefined;
                if (activeLndAggregate.lnd.macaroonHex) {
                    lndInfo = await lndGetInfo(activeLndAggregate.lnd.lndRestAddress, activeLndAggregate.lnd.macaroonHex);
                    // if response is not undefined and macaroon is set it means it's off
                    if (lndInfo) {
                        lndUri = lndInfo.uri;
                        lndStatus = LndStatusEnum.RUNNING;
                    } else {
                        try {
                            await lndUnlockWallet(activeLndAggregate.lnd.lndRestAddress, '');
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
                        await lndUnlockWallet(activeLndAggregate.lnd.lndRestAddress, '');
                    } catch (err) {
                        if (err instanceof LndWalletNotInitException) {
                            lndStatus = LndStatusEnum.INIT_REQUIRED;
                        }
                        if (err instanceof LndLockedException) {
                            lndStatus = LndStatusEnum.UNLOCK_REQUIRED;
                        }
                    }
                }
                return new UserLndsDto(
                    new UserLndDto(
                        activeLndAggregate.lnd.lndId,
                        activeLndAggregate.lnd.lndRestAddress,
                        lndStatus,
                        activeLndAggregate.lnd.lndType,
                        lndUri,
                        hostedLndType,
                        rtlAddress,
                        rtlOneTimeInitPassword,
                        lndInfo,
                    ),
                );
            } else if (activeLndAggregate.lnd.lndType === LndType.EXTERNAL) {
                let lndInfo: LndInfo | undefined = undefined;
                let lndStatus: LndStatusEnum = LndStatusEnum.TURNED_OFF;
                let lndUri: string | undefined = undefined;
                if (activeLndAggregate.lnd.macaroonHex) {
                    lndInfo = await lndGetInfo(activeLndAggregate.lnd.lndRestAddress, activeLndAggregate.lnd.macaroonHex);
                    // if response is not undefined and macaroon is set it means it's off
                    if (lndInfo) {
                        lndUri = lndInfo.uri;
                        lndStatus = LndStatusEnum.RUNNING;
                    } else {
                        try {
                            await lndUnlockWallet(activeLndAggregate.lnd.lndRestAddress, '');
                        } catch (err) {
                            lndStatus = LndStatusEnum.STOPPED;
                            if (err instanceof LndLockedException) {
                                lndStatus = LndStatusEnum.UNLOCK_REQUIRED;
                            }
                        }
                    }
                }
                return new UserLndsDto(
                    new UserLndDto(
                    activeLndAggregate.lnd.lndId,
                    activeLndAggregate.lnd.lndRestAddress,
                    lndStatus,
                    LndType.EXTERNAL,
                    lndUri,
                    undefined,
                    undefined,
                    undefined,
                    lndInfo,
                ));
            }
        } else {
            /**
             * Since every LN node on renew is replaced with LN node which is copy of user previous expired LN node,
             * there is no point to return user the list of his expired LN nodes. Only latest matters.
             */
            const latestLndAggregate: LndAggregate = lndAggregates[0];
            const digitalOceanArchive: DigitalOceanArchive | undefined = await findDigitalOceanArchive(latestLndAggregate.lnd.lndId);
            return new UserLndsDto(undefined, new ExpiredUserLndDto(
                latestLndAggregate.lnd.lndId,
                latestLndAggregate.lnd.publicKey,
                latestLndAggregate.lnd.creationDate,
                digitalOceanArchive!.archiveDate!,
            ));
        }
    } else {
        logError(`Cannot return user lnd for user ${userEmail} because has no LND added in Bittery!`);
        return undefined;
    }
};

export const getUserLndConnectUriDetails = async (userEmail: string): Promise<LndConnectUriDto | undefined> => {
    const lnd: Lnd | undefined = await findUserActiveLnd(userEmail);
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
