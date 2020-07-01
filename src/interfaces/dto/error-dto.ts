export class ErrorDto {
    errorMessage: string;
    errorCode: number | undefined = undefined;

    constructor(errorMessage: string, errorCode?: number | undefined) {
        this.errorMessage = errorMessage;
        this.errorCode = errorCode;
    }
}
