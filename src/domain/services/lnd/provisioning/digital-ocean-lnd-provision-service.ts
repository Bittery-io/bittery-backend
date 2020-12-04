import { CreateLndDto } from '../../../../interfaces/dto/lnd/create-lnd-dto';
import { DropletCreationInfo } from '../../../model/lnd/hosted/digital_ocean/droplet-creation-info';
import { getTls } from '../../../../application/lnd-connect-service';
import { DigitalOceanLnd } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { getCertThumbprint } from '../../../../application/openssl-service';
import { Rtl } from '../../../model/lnd/hosted/rtl/rtl';
import { HostedLndType } from '../../../model/lnd/hosted/hosted-lnd-type';
import { createLndDroplet } from './lnd-droplet-digital-ocean-provision-service';
import { insertDigitalOceanFailure } from '../../../repository/lnd/digital-ocean-failures-repository';
import { DigitalOceanFailure } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-failure';
import { logError } from '../../../../application/logging-service';
import { getMd5 } from '../../utils/checksum-service';

export const provisionDigitalOceanLnd = async (userEmail: string, lndId: string,
                                               createLndDto: CreateLndDto): Promise<DigitalOceanLnd | undefined> => {
    const dropletName: string = getMd5(userEmail);
    let dropletCreationInfo: DropletCreationInfo;
    try {
        dropletCreationInfo = await createLndDroplet(dropletName, userEmail, createLndDto.lndHostedType,
            createLndDto.wumboChannels, createLndDto.lnAlias);
    } catch (err) {
        logError(`Failed to create Digital Ocean LND for user with email ${userEmail}. 
                          Failed on deployment stage: ${err.failedDeploymentStage}`);
        await insertDigitalOceanFailure(new DigitalOceanFailure(
            userEmail,
            new Date().toISOString(),
            createLndDto.lndHostedType,
            err.failedDeploymentStage,
            err.dropletId,
            err.dropletName,
            err.dropletIp,
            err.rtlOneTimeInitPassword,
        ));
        return undefined;
    }
    try {
        const tlsCert: string = await getTls(dropletCreationInfo.tlsCertName);
        const tlsCertThumbprint: string = await getCertThumbprint(dropletCreationInfo.tlsCertName);
        const rtl: Rtl | undefined = createLndDto.lndHostedType === HostedLndType.STANDARD ?
            new Rtl(lndId, dropletCreationInfo.rtlOneTimeInitPassword!, dropletCreationInfo.rtlVersion!) :
            undefined;
        return new DigitalOceanLnd(
            userEmail,
            `${dropletCreationInfo.dropletIpPublic}:10009`,
            `https://${dropletCreationInfo.dropletIpPublic}/lnd-rest/btc`,
            tlsCert,
            tlsCertThumbprint,
            dropletCreationInfo.lndVersion,
            lndId,
            createLndDto.lndHostedType,
            dropletCreationInfo.dropletId,
            dropletCreationInfo.dropletName,
            dropletCreationInfo.dropletIpPublic,
            new Date().toISOString(),
            createLndDto.wumboChannels,
            createLndDto.lnAlias,
            undefined,
            rtl,
        );
    } catch (err) {
        logError(`It should not happen. Created Digital Ocean LND for user email ${userEmail} successfully
                          however failed due to unknown error few steps later. LND is init however saving it as failure`);
        await insertDigitalOceanFailure(new DigitalOceanFailure(
            userEmail,
            new Date().toISOString(),
            createLndDto.lndHostedType,
            err.failedDeploymentStage,
            dropletCreationInfo.dropletId,
            dropletCreationInfo.dropletName,
            dropletCreationInfo.dropletIpPublic,
            dropletCreationInfo.rtlOneTimeInitPassword,
        ));
        return undefined;
    }
};
