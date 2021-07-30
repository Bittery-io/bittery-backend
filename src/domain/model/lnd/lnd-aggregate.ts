import { Lnd } from './lnd';
import { HostedLnd } from './hosted/hosted-lnd';
import { DigitalOceanLnd } from './hosted/digital_ocean/digital-ocean-lnd';
import { Rtl } from './hosted/rtl/rtl';

export class LndAggregate {

    lnd: Lnd;
    hostedLnd?: HostedLnd;
    digitalOceanLnd?: DigitalOceanLnd;
    rtl?: Rtl;
    constructor(lnd: Lnd, hostedLnd?: HostedLnd, digitalOceanLnd?: DigitalOceanLnd, rtl?: Rtl) {
        this.lnd = lnd;
        this.hostedLnd = hostedLnd;
        this.digitalOceanLnd = digitalOceanLnd;
        this.rtl = rtl;
    }
}
