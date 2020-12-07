export class LndLockedException extends Error {

    constructor() {
        super();
        Object.setPrototypeOf(this, LndLockedException.prototype);
    }
}
