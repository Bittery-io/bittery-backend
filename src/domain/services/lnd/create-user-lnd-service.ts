import { UserDomain } from '../../model/lnd/user-domain';
import { LndCreateException } from '../../model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../../model/lnd/lnd-creation-error-type';
import { UserLndDto } from '../../../interfaces/dto/user-lnd-dto';
import { getProperty } from '../../../application/property-service';
import { getLndConnectUri } from './lnd-zap-connection-uri-service';
import { domainExists, findUserDomain, insertUserDomain } from '../../repository/user-domains-repository';
import { getCustomLndUrl, getLndInfo, getLndUrl } from '../../../application/lnd-connect-service';
import { generateNextLndPortToUse } from './lnd-port-generator-service';
import { insertUserLnd, userHasLnd } from '../../repository/user-lnds-repository';
import { SaveUserLndDto } from '../../../interfaces/dto/save-user-lnd-dto';
import { getCertThumbprint } from '../../../application/openssl-service';
import { findCustomLnd, insertCustomLnd, userHasCustomLnd } from '../../repository/custom-lnds-repository';
import { CustomLnd } from '../../model/lnd/custom-lnd';
import { getDevelopmentHostName, isDevelopmentEnv } from '../../../application/property-utils-service';
import { generateUuid } from '../utils/id-generator-service';
import { getMd5 } from '../utils/checksum-service';
import { LndStatusEnum } from '../../model/lnd/lnd-status-enum';
import { CustomLndDto } from '../../../interfaces/dto/custom-lnd-dto';
import { findUserRtl, insertUserRtl } from '../../repository/user-rtl-repository';
import { UserRtl } from '../../model/lnd/rtl/user-rtl';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo } from '../../../application/logging-service';
import { createUserLndNode } from './create-lnd-scripts-service';
import { existingRunningLnd, insertLndRuns } from '../../repository/lnd-run/lnd-runs-repository';
import { findLndRunRequest } from '../../repository/lnd-run/lnd-run-requests-repository';
import { LndRunRequest } from '../../model/lnd/run/lnd-run-request';
import { LndRun } from '../../model/lnd/run/lnd-run';
import { CreateLndDto } from '../../../interfaces/dto/lnd/create-lnd-dto';

export const createUserLnd = async (userEmail: string, createLndDto: CreateLndDto): Promise<void> => {
    if (!(await userHasLnd(userEmail))) {
        const domain: string = generateUuid();
        const rtlOneTimePassword: string = generateUuid();
        const md5Domain: string = isDevelopmentEnv() ? getDevelopmentHostName() : getMd5(domain);
        if (!await domainExists(md5Domain)) {
            const domainName: string = isDevelopmentEnv() ? md5Domain : `${md5Domain}.bittery.io`;
            const lndPort: number = await generateNextLndPortToUse();
            await createUserLndNode(domainName, String(lndPort), rtlOneTimePassword);
            await runInTransaction(async (client: PoolClient) => {
                await insertUserDomain(client, new UserDomain(userEmail, domainName));
                await insertUserLnd(client, domainName, createLndDto.lndType);
                await insertUserRtl(client, domainName, rtlOneTimePassword);
                await insertLndRuns(client, [new LndRun(domainName, new Date().toISOString())]);
            });
        } else {
            throw new Error('It should not happen but cannot create domain because it already exists!');
        }
    } else {
        throw new LndCreateException(`User ${userEmail} already has LND initialized!`, LndCreationErrorType.USER_ALREADY_HAS_LND);
    }
};

export const addExistingUserLnd = async (userEmail: string, saveUserLndDto: SaveUserLndDto): Promise<void> => {
    const userEmailHasLnd: boolean = await userHasLnd(userEmail);
    const userEmailHasCustomLnd: boolean = await userHasCustomLnd(userEmail);
    if (!userEmailHasLnd && !userEmailHasCustomLnd) {
        const lndInfo: any | undefined = await getLndInfo(saveUserLndDto.macaroonHex,
            saveUserLndDto.lndRestAddress,
            saveUserLndDto.tlsCertFileText);
        logInfo(`Successfully connected to user custom LND node address: ${saveUserLndDto.lndRestAddress}`);
        if (lndInfo) {
            const tlsCertThumbprint: string = await getCertThumbprint(userEmail, saveUserLndDto.tlsCertFileText);
            await insertCustomLnd(new CustomLnd(
                userEmail,
                saveUserLndDto.lndRestAddress,
                saveUserLndDto.macaroonHex,
                saveUserLndDto.tlsCertFileText,
                tlsCertThumbprint,
            ));
            logInfo(`Saved custom LND for user ${userEmail}`);
        } else {
            throw new LndCreateException(`Cannot add user ${userEmailHasLnd} LND because getting node info failed.`,
                LndCreationErrorType.GETTING_LND_INFO_FAILED);
        }
    } else {
        throw new LndCreateException(`Cannot add user ${userEmailHasLnd} LND because already has
            Bittery hosted: ${userEmailHasLnd}, custom: ${userEmailHasCustomLnd}.`,
            LndCreationErrorType.USER_ALREADY_HAS_LND);
    }
};

export const getUserLnd = async (userEmail: string): Promise<UserLndDto | undefined> => {
    const userDomain: UserDomain | undefined = await findUserDomain(userEmail);
    if (userDomain) {
        if (await userHasLnd(userEmail)) {
            const userLndIsRunning: boolean = await existingRunningLnd(userDomain.userDomain);
            if (userLndIsRunning) {
                // const lndUrl: string | undefined = await getLndUrl(userDomain.userDomain);
                const lndUrl: string | undefined = 'cos tam';
                const userRtl: UserRtl | undefined = await findUserRtl(userEmail);
                const lndStatus: LndStatusEnum = lndUrl ? LndStatusEnum.WORKING : LndStatusEnum.STOPPED;
                const lndRestAddress: string = `https://${userDomain.userDomain}:444/lnd-rest/btc/`;
                return new UserLndDto(
                    lndRestAddress,
                    `https://${userDomain.userDomain}:446${getProperty('RTL_URL')}`,
                    // await getLndConnectUri(userDomain.userDomain),
                    'lnd connect uri',
                    lndUrl ? lndUrl : 'Connection to node failed.',
                    lndStatus,
                    userRtl!.rtlInitPassword,
                );
            } else {
                logInfo(`Returning user ${userEmail} LND however its currently TURNED OFF.`);
                const lndRunRequest: LndRunRequest | undefined = await findLndRunRequest(userDomain.userDomain);
                return new UserLndDto(
                    'Currently unavailable. LND node is turned off.',
                    'Currently unavailable. LND node is turned off.',
                    'Currently unavailable. LND node is turned off.',
                    'Currently unavailable. LND node is turned off.',
                    LndStatusEnum.TURNED_OFF,
                    'Currently unavailable. LND node is turned off.',
                    lndRunRequest !== undefined,
                );
            }
        } else {
            logError(`Cannot return user lnd for user ${userEmail} because has no Bittery lnd!`);
            return undefined;
        }
    } else {
        logError(`Cannot return user lnd for user ${userEmail} because has no domain yet`);
        return undefined;
    }
};

export const getCustomUserLnd = async (userEmail: string): Promise<CustomLndDto | undefined> => {
    const customLnd: CustomLnd | undefined = await findCustomLnd(userEmail);
    if (customLnd) {
        const lndUrl: string | undefined = await getCustomLndUrl(customLnd.macaroonHex, customLnd.lndRestAddress, customLnd.tlsCert);
        const lndStatus: LndStatusEnum = lndUrl ? LndStatusEnum.WORKING : LndStatusEnum.STOPPED;
        return new CustomLndDto(
            customLnd.lndRestAddress,
            customLnd.macaroonHex,
            customLnd.tlsCert,
            lndUrl ? lndUrl : 'Connection to node failed.',
            lndStatus,
        );
    } else {
        logError(`Cannot return custom lnd for user ${userEmail} because has no custom lnd!`);
        return undefined;
    }
};
