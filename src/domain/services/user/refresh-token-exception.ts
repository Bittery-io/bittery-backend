export class RefreshTokenException extends Error {

    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, RefreshTokenException.prototype);
    }
}
