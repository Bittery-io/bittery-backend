import { HostedLndType } from './hosted-lnd-type';
import { Lnd } from '../lnd';
import { LndType } from '../lnd-type';
import { HostedLndProvider } from './hosted-lnd-provider';

export class HostedLnd extends Lnd {

    hostedLndType: HostedLndType;
    hostedLndProvider: HostedLndProvider;
    wumboChannels: boolean;
    lnAlias?: string;

    constructor(lndId: string, userEmail: string, lndRestAddress: string, tlsCert: string,
                tlsCertThumbprint: string, lndVersion: string, lndType: LndType, hostedLndType: HostedLndType,
                hostedLndProvider: HostedLndProvider, creationDate: string, wumboChannels: boolean,
                isActive: boolean, lnAlias?: string, macaroonHex?: string) {
        super(lndId, userEmail, lndRestAddress, tlsCert, tlsCertThumbprint, lndVersion, lndType,
            creationDate, isActive, macaroonHex);
        this.hostedLndType = hostedLndType;
        this.hostedLndProvider = hostedLndProvider;
        this.wumboChannels = wumboChannels;
        this.lnAlias = lnAlias;
    }
}
