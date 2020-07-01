export class InMemoryDatabaseException extends Error {
    clientErrorCode: number;

    constructor(m: string, clientErrorCode: number) {
        super(m);
        this.clientErrorCode = clientErrorCode;
        Object.setPrototypeOf(this, InMemoryDatabaseException.prototype);
    }
}
