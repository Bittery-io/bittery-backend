import { LndFullBackupDto } from '../../../../interfaces/dto/lnd/backup/lnd-full-backup-dto';
import { UserEncryptedLnArtefacts } from '../../../model/user/user-encrypted-ln-artefacts';
import { findUserEncryptedArtefacts } from '../../../repository/user-encrypted-ln-artefacts-repository';
import { logError } from '../../../../application/logging-service';
import { findUserLndTls } from '../../../repository/lnd/lnds-repository';
import { getLatestLndStaticChannelBackups } from '../../../repository/lnd/static-channel-backup/lnd-static-channek-backup-repository';
import { LndStaticChannelBackup } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup';
import { AllStaticChannelsBackupDto } from '../../../../interfaces/dto/lnd/backup/all-static-channels-backup-dto';

export const getLnFullBackup = async (userEmail: string,
                                      lndId: string,
                                      seedBackup: boolean,
                                      macaroonBackup: boolean,
                                      passwordBackup: boolean,
                                      scbBackup: boolean,
                                      tlsBackup: boolean): Promise<LndFullBackupDto | undefined> => {
    const userEncryptedLnArtefacts: UserEncryptedLnArtefacts | undefined = await findUserEncryptedArtefacts(userEmail, lndId);
    if (!userEncryptedLnArtefacts) {
        logError(`Cannot get LN full node backup for user ${userEmail} and lndId ${lndId} because encrypted artefacts not found!`);
        return undefined;
    }
    let lndStaticChannelBackup: LndStaticChannelBackup | undefined = undefined;
    if (scbBackup) {
        lndStaticChannelBackup = await getLatestLndStaticChannelBackups(userEmail, lndId);
    }
    let tlsCert: string | undefined = undefined;
    if (tlsBackup) {
        tlsCert = await findUserLndTls(userEmail, lndId);
    }
    return new LndFullBackupDto(
        macaroonBackup ? userEncryptedLnArtefacts.adminMacaroon : undefined,
        passwordBackup ? userEncryptedLnArtefacts.lnPassword : undefined,
        seedBackup ? userEncryptedLnArtefacts.lnSeed : undefined,
        tlsBackup ? tlsCert! : undefined,
        scbBackup ? (lndStaticChannelBackup !== undefined ? new AllStaticChannelsBackupDto(
            lndStaticChannelBackup.staticChannelBackupJsonBase64!,
            lndStaticChannelBackup.creationDate) : undefined) : undefined,
    );
};
