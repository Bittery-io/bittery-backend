import { StoreInvoice } from '../../services/btcpay/invoice/store-invoice';
import { dbPool } from '../../../application/db/db';

export const insertStoreInvoice = async (storeInvoice: StoreInvoice): Promise<void> => {
    await dbPool.query(`
                INSERT INTO STORE_INVOICES(STORE_ID, INVOICE_ID, ORDER_ID, CREATION_DATE)
                VALUES ($1, $2, $3, $4)`,
        [storeInvoice.storeId, storeInvoice.invoiceId, storeInvoice.orderId, storeInvoice.creationDate]);
};

export const findStoreInvoicesInvoiceIdsBetweenDates = async (
        storeId: string, fromDate: Date, toDate: Date): Promise<string[]> => {
    const res = await dbPool.query(`
                select * from STORE_INVOICES WHERE STORE_ID = $1 AND CREATION_DATE > $2 AND CREATION_DATE < $3`,
        [storeId, fromDate, toDate]);
    return res.rows.map(_ => _.invoice_id);
};

export const findStoreInvoicesOrderIdsLimit = async (storeId: string, limit: number): Promise<string[]> => {
    const res = await dbPool.query(`
                select ORDER_ID from STORE_INVOICES WHERE STORE_ID = $1 ORDER BY CREATION_DATE DESC LIMIT $2`,
        [storeId, limit]);
    return res.rows.map(_ => _.order_id);
};
