export class DigitalOceanLndForRestart {
    dropletIp: string;
    dropletId: number;
    wumboChannels: boolean;
    lnAlias?: string;

    constructor(dropletIp: string, dropletId: number, wumboChannels: boolean, lnAlias?: string) {
        this.dropletIp = dropletIp;
        this.dropletId = dropletId;
        this.wumboChannels = wumboChannels;
        this.lnAlias = lnAlias;
    }
}
