import { HostedLndType } from './hosted-lnd-type';
import { Lnd } from '../lnd';
import { LndType } from '../lnd-type';
import { HostedLndProvider } from './hosted-lnd-provider';
import { Rtl } from './rtl/rtl';

export class HostedLnd extends Lnd {

    hostedLndType: HostedLndType;
    hostedLndProvider: HostedLndProvider;

    constructor(lndId: string, userEmail: string, lndAddress: string, lndRestAddress: string, tlsCert: string,
                tlsCertThumbprint: string, lndVersion: string, lndType: LndType, hostedLndType: HostedLndType,
                hostedLndProvider: HostedLndProvider, macaroonHex?: string, rtl?: Rtl) {
        super(lndId, userEmail, lndAddress, lndRestAddress, tlsCert, tlsCertThumbprint, lndVersion, lndType, macaroonHex, rtl);
        this.hostedLndType = hostedLndType;
        this.hostedLndProvider = hostedLndProvider;
    }
}
