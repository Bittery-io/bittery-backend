import { DigitalOceanLnd } from './hosted/digital_ocean/digital-ocean-lnd';
import { Rtl } from './hosted/rtl/rtl';

export class DigitalOceanLndHosting {
    digitalOceanLnd: DigitalOceanLnd;
    rtl?: Rtl;

    constructor(digitalOceanLnd: DigitalOceanLnd, rtl?: Rtl) {
        this.digitalOceanLnd = digitalOceanLnd;
        this.rtl = rtl;
    }
}
