import { AllStaticChannelsBackupDto } from './all-static-channels-backup-dto';

export class LndFullBackupDto {
    adminMacaroon?: string;
    lnPassword?: string;
    lnSeed?: string;
    tlsCert?: string;
    allStaticChannelsBackupDto?: AllStaticChannelsBackupDto;

    constructor(adminMacaroon?: string, lnPassword?: string, lnSeed?: string,
                tlsCert?: string, allStaticChannelsBackupDto?: AllStaticChannelsBackupDto) {
        this.adminMacaroon = adminMacaroon;
        this.lnPassword = lnPassword;
        this.lnSeed = lnSeed;
        this.tlsCert = tlsCert;
        this.allStaticChannelsBackupDto = allStaticChannelsBackupDto;
    }
}
