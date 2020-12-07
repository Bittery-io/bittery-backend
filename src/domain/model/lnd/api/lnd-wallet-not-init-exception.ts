export class LndWalletNotInitException extends Error {

    constructor() {
        super();
        Object.setPrototypeOf(this, LndWalletNotInitException.prototype);
    }
}
