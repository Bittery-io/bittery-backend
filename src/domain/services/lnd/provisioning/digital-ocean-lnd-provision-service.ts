import { CreateLndDto } from '../../../../interfaces/dto/lnd/create-lnd-dto';
import { DropletCreationInfo } from '../../../model/lnd/hosted/digital_ocean/droplet-creation-info';
import { getTls } from '../../../../application/lnd-connect-service';
import { DigitalOceanLnd } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { getCertThumbprint } from '../../../../application/openssl-service';
import { Rtl } from '../../../model/lnd/hosted/rtl/rtl';
import { HostedLndType } from '../../../model/lnd/hosted/hosted-lnd-type';
import { createLndDroplet } from './lnd-droplet-digital-ocean-provision-service';

export const provisionDigitalOceanLnd = async (userEmail: string, lndId: string,
                                               createLndDto: CreateLndDto): Promise<DigitalOceanLnd> => {
    const dropletCreationInfo: DropletCreationInfo = await createLndDroplet(userEmail, createLndDto.lndHostedType);
    const tlsCert: string = await getTls(dropletCreationInfo.tlsCertName);
    const tlsCertThumbprint: string = await getCertThumbprint(dropletCreationInfo.tlsCertName);
    const rtl: Rtl | undefined = createLndDto.lndHostedType === HostedLndType.STANDARD ?
        new Rtl(lndId, dropletCreationInfo.rtlOneTimePassword!, dropletCreationInfo.rtlVersion!) :
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
        undefined,
        rtl,
    );
};
