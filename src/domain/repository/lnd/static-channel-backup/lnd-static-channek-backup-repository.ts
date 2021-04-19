import { LndStaticChannelBackup } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup';
import { dbPool } from '../../../../application/db/db';
import { LndStaticChannelBackupType } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup-type';
import { LndStaticChannelBackupStatus } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup-status';
import { LndStaticChannelBackupClientReadView } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup-client-read-view';

export const insertLndStaticChannelBackups = async (lndStaticChannelBackups: LndStaticChannelBackup[]): Promise<void> => {
    const ids: string[] = [];
    const lndIds: string[] = [];
    const creationDates: string[] = [];
    const staticChannelBackupJsonBase64s: string[] = [];
    const types: LndStaticChannelBackupType[] = [];
    const statuses: LndStaticChannelBackupStatus[] = [];
    const messages: string[] = [];
    lndStaticChannelBackups.forEach((lndStaticChannelBackup) => {
        ids.push(lndStaticChannelBackup.id);
        lndIds.push(lndStaticChannelBackup.lndId);
        creationDates.push(lndStaticChannelBackup.creationDate);
        if (lndStaticChannelBackup.staticChannelBackupJsonBase64) {
            staticChannelBackupJsonBase64s.push(lndStaticChannelBackup.staticChannelBackupJsonBase64);
        }
        types.push(lndStaticChannelBackup.type);
        statuses.push(lndStaticChannelBackup.status);
        if (lndStaticChannelBackup.message) {
            messages.push(lndStaticChannelBackup.message);
        }
    });
    await dbPool.query(`
        INSERT INTO LND_STATIC_CHANNEL_BACKUPS(ID, LND_ID, CREATION_DATE, STATIC_CHANNEL_BACKUP_JSON_BASE64, TYPE, STATUS, MESSAGE)
        SELECT fs.id, fs.lnd_id, fs.creation_date, fs.static_channel_backup_json_base_64, fs.type, fs.status, fs.message
        FROM UNNEST($1::uuid[], $2::uuid[], $3::timestamp[], $4::text[], $5::text[], $6::text[], $7::text[])
        WITH ORDINALITY AS fs(id, lnd_id, creation_date, static_channel_backup_json_base_64, type, status, message)`,
        [ids, lndIds, creationDates, staticChannelBackupJsonBase64s, types, statuses, messages]);
};

export const getLndStaticChannelBackupClientReadViews = async (userEmail: string, lndId: string, limit: number):
        Promise<LndStaticChannelBackupClientReadView[]> => {
    const result = await dbPool.query(`SELECT b.ID, b.creation_date, b.type, b.status 
                                FROM LND_STATIC_CHANNEL_BACKUPS b 
                                JOIN LNDS l ON l.LND_ID = b.LND_ID WHERE l.LND_ID = $1 AND l.USER_EMAIL = $2
                                ORDER BY b.creation_date DESC LIMIT $3`,
        [lndId, userEmail, limit]);
    return result.rows.map(row =>
        new LndStaticChannelBackupClientReadView(
            row.id,
            row.creation_date,
            row.type,
            row.status,
        ));
};
