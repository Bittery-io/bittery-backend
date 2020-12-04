import { LndCreateException } from '../../model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../../model/lnd/lnd-creation-error-type';
import { UserLndDto } from '../../../interfaces/dto/user-lnd-dto';
import { getLndInfo } from '../../../application/lnd-connect-service';
import { SaveUserLndDto } from '../../../interfaces/dto/save-user-lnd-dto';
import { getCertThumbprintForExternalLnd } from '../../../application/openssl-service';
import { generateUuid } from '../utils/id-generator-service';
import { CustomLndDto } from '../../../interfaces/dto/custom-lnd-dto';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo } from '../../../application/logging-service';
import { CreateLndDto } from '../../../interfaces/dto/lnd/create-lnd-dto';
import { provisionDigitalOceanLnd } from './provisioning/digital-ocean-lnd-provision-service';
import { DigitalOceanLnd } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { insertLnd, userHasLnd } from '../../repository/lnd/lnds-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { insertHostedLnd } from '../../repository/lnd/lnd-hosted-repository';
import { insertDigitalOceanLnd } from '../../repository/lnd/digital-ocean-lnds-repository';
import { insertUserRtl } from '../../repository/lnd/rtls-repository';
import { Lnd } from '../../model/lnd/lnd';
import { LndType } from '../../model/lnd/lnd-type';

export const createLnd = async (userEmail: string, createLndDto: CreateLndDto): Promise<void> => {
    if (!(await userHasLnd(userEmail))) {
        const lndId: string = generateUuid();
        const digitalOceanLnd: DigitalOceanLnd | undefined = await provisionDigitalOceanLnd(userEmail, lndId, createLndDto);
        if (digitalOceanLnd) {
            await runInTransaction(async (client: PoolClient) => {
                await insertLnd(client, digitalOceanLnd);
                if (createLndDto.lndHostedType === HostedLndType.STANDARD) {
                    await insertHostedLnd(client, digitalOceanLnd);
                    await insertUserRtl(client, digitalOceanLnd.rtl!);
                    await insertDigitalOceanLnd(client, digitalOceanLnd);
                } else {
                    await insertHostedLnd(client, digitalOceanLnd);
                    await insertDigitalOceanLnd(client, digitalOceanLnd);
                }
            });
        }
    } else {
        throw new LndCreateException(`User ${userEmail} already has LND added!`, LndCreationErrorType.USER_ALREADY_HAS_LND);
    }
};

export const addExternalLnd = async (userEmail: string, saveUserLndDto: SaveUserLndDto): Promise<void> => {
    const lndInfo: any | undefined = await getLndInfo(saveUserLndDto.macaroonHex,
        saveUserLndDto.lndRestAddress,
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
    if (await userHasLnd(userEmail)) {
        // const lndUrl: string | undefined = await getLndUrl(userDomain.userDomain);
        // // const lndUrl: string | undefined = 'cos tam';
        // const userRtl: Rtl | undefined = await findUserRtl(userEmail);
        // const lndStatus: LndStatusEnum = lndUrl ? LndStatusEnum.WORKING : LndStatusEnum.STOPPED;
        // const lndRestAddress: string = `https://${userDomain.userDomain}:444/lnd-rest/btc/`;
        // return new UserLndDto(
        //     lndRestAddress,
        //     'rtl',
        //     // await getLndConnectUri(userDomain.userDomain),
        //     'lnd connect uri',
        //     lndUrl ? lndUrl : 'Connection to node failed.',
        //     lndStatus,
        //     userRtl!.rtlOneTimeInitPassword,
        // );
        // todo zrobic
        return undefined;
    } else {
        logError(`Cannot return user lnd for user ${userEmail} because has no Bittery lnd!`);
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
