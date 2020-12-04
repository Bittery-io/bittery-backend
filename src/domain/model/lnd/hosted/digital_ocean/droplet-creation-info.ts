export class DropletCreationInfo {
    dropletId: number;
    dropletName: string;
    dropletIpPublic: string;
    tlsCertName: string;
    lndVersion: string;
    rtlVersion?: string;
    rtlOneTimeInitPassword?: string;

    constructor(dropletId: number, dropletName: string, dropletIpPublic: string, tlsCertName: string, lndVersion: string,
                rtlVersion?: string, rtlOneTimeInitPassword?: string) {
        this.dropletId = dropletId;
        this.dropletName = dropletName;
        this.dropletIpPublic = dropletIpPublic;
        this.tlsCertName = tlsCertName;
        this.lndVersion = lndVersion;
        this.rtlVersion = rtlVersion;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
    }
}
