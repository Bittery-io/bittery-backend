import { HostedLnd } from '../hosted-lnd';
import { LndType } from '../../lnd-type';
import { HostedLndType } from '../hosted-lnd-type';
import { HostedLndProvider } from '../hosted-lnd-provider';
import { Rtl } from '../rtl/rtl';

export class DigitalOceanLnd extends HostedLnd {

    dropletId: number;
    dropletName: string;
    dropletIp: string;

    constructor(userEmail: string, lndRestAddress: string,
                tlsCert: string, tlsCertThumbprint: string, lndVersion: string, lndId: string,
                hostedLndType: HostedLndType, dropletId: number, dropletName: string, dropletIp: string,
                creationDate: string, wumboChannels: boolean, lnAlias?: string, macaroonHex?: string) {
        super(lndId, userEmail, lndRestAddress, tlsCert, tlsCertThumbprint,
            lndVersion, LndType.HOSTED, hostedLndType, HostedLndProvider.DIGITAL_OCEAN, creationDate, wumboChannels,
            lnAlias, macaroonHex);
        this.dropletId = dropletId;
        this.dropletName = dropletName;
        this.dropletIp = dropletIp;
    }
}
