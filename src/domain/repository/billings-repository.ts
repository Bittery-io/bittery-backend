import { PoolClient } from 'pg';
import { Billing } from '../model/billings/billing';
import { dbPool } from '../../application/db/db';
import { Product } from '../model/billings/product';
import { BillingStatus } from '../model/billings/billing-status';

export const insertBilling = async (client: PoolClient, billing: Billing): Promise<void> => {
    await client.query(`
                INSERT INTO BILLINGS(ID, USER_EMAIL, PRODUCT, INVOICE_ID, CREATION_DATE, PAID_TO_DATE, STATUS)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [billing.id, billing.userEmail, billing.product, billing.invoiceId, billing.creationDate, billing.paidToDate,
            billing.status]);
};

export const findBillingsNewestFirst = async (userEmail: string): Promise<Billing[]> => {
    const res = await dbPool.query(`SELECT * FROM BILLINGS WHERE USER_EMAIL = $1 
                             ORDER BY CREATION_DATE DESC`, [userEmail]);
    return res.rows.map(row => new Billing(
        row.id,
        row.user_email,
        row.product,
        row.invoice_id,
        row.creation_date,
        row.paid_to_date,
        row.status,
    ));
};

// during lnd creation paid invoice is inserted
export const findLatestCreatedBillingWithStatus = async (
        userEmail: string, product: Product, billingStatus: BillingStatus): Promise<Billing | undefined> => {
    const res = await dbPool.query(`SELECT * FROM BILLINGS WHERE USER_EMAIL = $1 AND 
                             PRODUCT = $2 AND STATUS = $3 ORDER BY CREATION_DATE DESC LIMIT 1`,
        [userEmail, product, billingStatus]);
    return res.rows.length === 1 ? new Billing(
        res.rows[0].id,
        res.rows[0].user_email,
        res.rows[0].product,
        res.rows[0].invoice_id,
        res.rows[0].creation_date,
        res.rows[0].paid_to_date,
        res.rows[0].status,
    ) : undefined;
};
