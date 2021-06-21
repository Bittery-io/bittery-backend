import { LndFullBackupDto } from '../../../../interfaces/dto/lnd/backup/lnd-full-backup-dto';
import { logError } from '../../../../application/logging-service';
import { findUserLndTls } from '../../../repository/lnd/lnds-repository';
import { getLatestLndStaticChannelBackups } from '../../../repository/lnd/static-channel-backup/lnd-static-channek-backup-repository';
import { LndStaticChannelBackup } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup';
import { AllStaticChannelsBackupDto } from '../../../../interfaces/dto/lnd/backup/all-static-channels-backup-dto';
import { findUserEncryptedLnArtefacts } from '../../../repository/encrypted/user-encrypted-ln-artefacts-repository';
import { UserEncryptedLnArtefact } from '../../../model/encrypted/user-encrypted-ln-artefact';
import { EncryptedLnArtefactType } from '../../../model/encrypted/encrypted-ln-artefact-type';

export const getLnFullBackup = async (userEmail: string,
                                      lndId: string,
                                      seedBackup: boolean,
                                      macaroonBackup: boolean,
                                      passwordBackup: boolean,
                                      scbBackup: boolean,
                                      tlsBackup: boolean): Promise<LndFullBackupDto | undefined> => {
    const userEncryptedLnArtefacts: UserEncryptedLnArtefact[] = await findUserEncryptedLnArtefacts(userEmail, lndId);
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
        macaroonBackup ? getEncryptedArtefact(userEncryptedLnArtefacts, EncryptedLnArtefactType.ADMIN_MACAROON_HEX) : undefined,
        passwordBackup ? getEncryptedArtefact(userEncryptedLnArtefacts, EncryptedLnArtefactType.LN_PASSWORD) : undefined,
        seedBackup ? getEncryptedArtefact(userEncryptedLnArtefacts, EncryptedLnArtefactType.LN_SEED_MNEMONIC) : undefined,
        tlsBackup ? tlsCert! : undefined,
        scbBackup ? (lndStaticChannelBackup !== undefined ? new AllStaticChannelsBackupDto(
            lndStaticChannelBackup.staticChannelBackupJsonBase64!,
            lndStaticChannelBackup.creationDate) : undefined) : undefined,
    );
};

const getEncryptedArtefact = (userEncryptedLnArtefacts: UserEncryptedLnArtefact[],
                              encryptedLnArtefactType: EncryptedLnArtefactType): string | undefined => {
    const userEncryptedLnArtefact: UserEncryptedLnArtefact | undefined = userEncryptedLnArtefacts
        .filter(_ => _.encryptedLnArtefactType === encryptedLnArtefactType)[0];
    return userEncryptedLnArtefact ? userEncryptedLnArtefact.encryptedArtefact : undefined;
};
