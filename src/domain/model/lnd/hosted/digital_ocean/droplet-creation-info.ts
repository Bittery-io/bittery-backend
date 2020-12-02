export class DropletCreationInfo {
    dropletId: number;
    dropletName: string;
    dropletIpPublic: string;
    tlsCertName: string;
    lndVersion: string;
    rtlVersion?: string;
    rtlOneTimePassword?: string;

    constructor(dropletId: number, dropletName: string, dropletIpPublic: string, tlsCertName: string, lndVersion: string,
                rtlVersion?: string, rtlOneTimePassword?: string) {
        this.dropletId = dropletId;
        this.dropletName = dropletName;
        this.dropletIpPublic = dropletIpPublic;
        this.tlsCertName = tlsCertName;
        this.lndVersion = lndVersion;
        this.rtlVersion = rtlVersion;
        this.rtlOneTimePassword = rtlOneTimePassword;
    }
}
