import { PoolClient } from 'pg';
import { dbPool } from '../../application/db/db';
import { BillingStatus } from '../model/billings/billing-status';
import { LndBilling } from '../model/billings/lnd-billing';

export const insertBilling = async (client: PoolClient, billing: LndBilling): Promise<void> => {
    await client.query(`
                INSERT INTO LND_BILLINGS(ID, USER_EMAIL, LND_ID, INVOICE_ID, CREATION_DATE, SUBSCRIPTION_MONTHS, PAID_TO_DATE, STATUS)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [billing.id, billing.userEmail, billing.lndId, billing.invoiceId, billing.creationDate, billing.subscriptionMonths, billing.paidToDate,
            billing.status]);
};

export const updateBilling = async (billing: LndBilling): Promise<void> => {
    await dbPool.query(`UPDATE LND_BILLINGS SET PAID_TO_DATE = $1, STATUS = $2, LND_ID = $3 WHERE ID = $4`,
        [billing.paidToDate, billing.status, billing.lndId, billing.id]);
};

export const updateAllBillingsWithGivenStatusSetNewStatus = async (
        client: PoolClient, userEmail: string, oldStatus: BillingStatus, newStatus: BillingStatus): Promise<void> => {
    await client.query(`UPDATE LND_BILLINGS SET STATUS = $1 WHERE USER_EMAIL = $2 AND STATUS = $3`,
        [newStatus, userEmail, oldStatus]);
};

export const findBilling = async (userEmail: string, invoiceId: string): Promise<LndBilling | undefined> => {
    const res = await dbPool.query(`SELECT * FROM LND_BILLINGS WHERE USER_EMAIL = $1 AND INVOICE_ID = $2`,
        [userEmail, invoiceId]);
    return res.rows.length === 1 ? new LndBilling(
        res.rows[0].id,
        res.rows[0].user_email,
        res.rows[0].lnd_id,
        res.rows[0].invoice_id,
        res.rows[0].creation_date,
        res.rows[0].status,
        res.rows[0].subscription_months,
        res.rows[0].paid_to_date,
    ) : undefined;
};

export const findBillingsNewestFirst = async (userEmail: string): Promise<LndBilling[]> => {
    const res = await dbPool.query(`SELECT * FROM LND_BILLINGS WHERE USER_EMAIL = $1 
                             ORDER BY CREATION_DATE DESC`, [userEmail]);
    return res.rows.map(row => new LndBilling(
        row.id,
        row.user_email,
        row.lnd_id,
        row.invoice_id,
        row.creation_date,
        row.status,
        row.subscription_months,
        row.paid_to_date,
    ));
};

// during lnd creation paid invoice is inserted
export const findLatestCreatedBillingWithStatus = async (
        userEmail: string, billingStatus: BillingStatus): Promise<LndBilling | undefined> => {
    const res = await dbPool.query(`SELECT * FROM LND_BILLINGS WHERE USER_EMAIL = $1 AND 
                             STATUS = $2 ORDER BY CREATION_DATE DESC LIMIT 1`,
        [userEmail, billingStatus]);
    return res.rows.length === 1 ? new LndBilling(
        res.rows[0].id,
        res.rows[0].user_email,
        res.rows[0].lnd_id,
        res.rows[0].invoice_id,
        res.rows[0].creation_date,
        res.rows[0].status,
        res.rows[0].subscription_months,
        res.rows[0].paid_to_date,
    ) : undefined;
};

// todo it makes full table scan, not the best
export const findBillingsWithStatus = async (status: BillingStatus): Promise<LndBilling[]> => {
    const res = await dbPool.query(`SELECT * FROM LND_BILLINGS WHERE STATUS = $1`,
        [status]);
    return res.rows.map(row => new LndBilling(
        row.id,
        row.user_email,
        row.lnd_id,
        row.invoice_id,
        row.creation_date,
        row.status,
        row.subscription_months,
        row.paid_to_date,
    ));
};

export const findBillingsWithStatusWherePaidToDateIsInFuture = async (status: BillingStatus): Promise<LndBilling[]> => {
    const res = await dbPool.query(`SELECT * FROM LND_BILLINGS WHERE STATUS = $1 AND PAID_TO_DATE > now()`,
        [status]);
    return res.rows.map(row => new LndBilling(
        row.id,
        row.user_email,
        row.lnd_id,
        row.invoice_id,
        row.creation_date,
        row.status,
        row.subscription_months,
        row.paid_to_date,
    ));
};

// todo it calls digital ocean tables... anyway it selects only billings for LND which is not yet archived so is not yet in archives table
// it works well if btcpay webhook updated LND_ID of latest paid being which caused lnd restore
export const findBillingsWithStatusWherePaidToDateIsInPastAndIsNotYetArchived = async (status: BillingStatus): Promise<LndBilling[]> => {
    const res = await dbPool.query(`SELECT * FROM LND_BILLINGS WHERE ID IN 
                                                        (SELECT lb.id
                                                         FROM LND_BILLINGS lb LEFT JOIN digital_ocean_archives doa
                                                         ON lb.lnd_id = doa.lnd_id
                                                         WHERE lb.STATUS = $1 AND lb.PAID_TO_DATE < now() AND DOA.archive_date IS NULL)
                                                    ORDER BY CREATION_DATE DESC LIMIT 1;`,
        [status]);
    return res.rows.map(row => new LndBilling(
        row.id,
        row.user_email,
        row.lnd_id,
        row.invoice_id,
        row.creation_date,
        row.status,
        row.subscription_months,
        row.paid_to_date,
    ));
};
