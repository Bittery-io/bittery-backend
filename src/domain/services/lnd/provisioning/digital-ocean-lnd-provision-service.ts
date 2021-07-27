import { CreateLndDto } from '../../../../interfaces/dto/lnd/create-lnd-dto';
import { DropletCreationInfo } from '../../../model/lnd/hosted/digital_ocean/droplet-creation-info';
import { getTls } from '../../../../application/lnd-connect-service';
import { DigitalOceanLnd } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { getCertThumbprint } from '../../../../application/openssl-service';
import { Rtl } from '../../../model/lnd/hosted/rtl/rtl';
import { HostedLndType } from '../../../model/lnd/hosted/hosted-lnd-type';
import { createLndDroplet } from './lnd-droplet-digital-ocean-provision-service';
import { DigitalOceanFailure } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-failure';
import { logError } from '../../../../application/logging-service';
import { getMd5 } from '../../utils/checksum-service';
import { DigitalOceanLndHosting } from '../../../model/lnd/digital-ocean-lnd-hosting';
import { sendSetupLndFailedForUserEmail } from '../../../../application/mail-service';
import { insertDigitalOceanFailure } from '../../../repository/lnd/digital-ocean/digital-ocean-failures-repository';

export const provisionDigitalOceanLnd = async (
        userEmail: string,
        lndId: string,
        createLndDto: CreateLndDto,
        lndHostedVersion?: string,
        rtlHostedVersion?: string,
        rtlOneTimePassword?: string): Promise<DigitalOceanLndHosting | undefined> => {
    const dropletName: string = getMd5(userEmail);
    let dropletCreationInfo: DropletCreationInfo;
    try {
        dropletCreationInfo = await createLndDroplet(dropletName, userEmail, createLndDto.hostedLndType,
            false, createLndDto.lnAlias, lndHostedVersion, rtlHostedVersion);
    } catch (err) {
        logError(`Failed to create Digital Ocean LND for user with email ${userEmail}. 
                          Failed on deployment stage: ${err.failedDeploymentStage}.
                          Error message: ${err.errorMessage}`);
        await insertDigitalOceanFailure(new DigitalOceanFailure(
            userEmail,
            new Date().toISOString(),
            createLndDto.hostedLndType,
            err.failedDeploymentStage,
            err.dropletId,
            err.dropletName,
            err.dropletIpPublic,
            err.rtlOneTimeInitPassword,
        ));
        await sendSetupLndFailedForUserEmail(userEmail, err.failedDeploymentStage, err.errorMessage);
        return undefined;
    }
    try {
        const tlsCert: string = await getTls(dropletCreationInfo.tlsCertName);
        const tlsCertThumbprint: string = await getCertThumbprint(dropletCreationInfo.tlsCertName);
        const rtl: Rtl | undefined = createLndDto.hostedLndType === HostedLndType.STANDARD ?
            new Rtl(lndId, dropletCreationInfo.rtlOneTimeInitPassword!, dropletCreationInfo.rtlVersion!) :
            undefined;
        const digitalOceanLnd: DigitalOceanLnd = new DigitalOceanLnd(
            userEmail,
            `https://${dropletCreationInfo.dropletIpPublic}/lnd-rest/btc`,
            tlsCert,
            tlsCertThumbprint,
            dropletCreationInfo.lndVersion,
            lndId,
            createLndDto.hostedLndType,
            dropletCreationInfo.dropletId,
            dropletCreationInfo.dropletName,
            dropletCreationInfo.dropletIpPublic,
            new Date().toISOString(),
            false,
            true,
            createLndDto.lnAlias,
            undefined,
        );
        return new DigitalOceanLndHosting(digitalOceanLnd, rtl);
    } catch (err) {
        logError(`It should not happen. Created Digital Ocean LND for user email ${userEmail} successfully
                          however failed due to unknown error few steps later. LND is init however saving it as failure`);
        await insertDigitalOceanFailure(new DigitalOceanFailure(
            userEmail,
            new Date().toISOString(),
            createLndDto.hostedLndType,
            err.failedDeploymentStage,
            dropletCreationInfo.dropletId,
            dropletCreationInfo.dropletName,
            dropletCreationInfo.dropletIpPublic,
            dropletCreationInfo.rtlOneTimeInitPassword,
        ));
        return undefined;
    }
};
