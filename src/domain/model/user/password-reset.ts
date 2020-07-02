export class PasswordReset {
    userEmail: string;
    passwordResetKey: string;
    resetDone: boolean;
    messageId: string;
    creationDate: string;
    resetDoneDate?: string;

    constructor(userEmail: string, passwordResetKey: string, resetDone: boolean, messageId: string,
                creationDate: string, resetDoneDate?: string) {
        this.userEmail = userEmail;
        this.passwordResetKey = passwordResetKey;
        this.resetDone = resetDone;
        this.creationDate = creationDate;
        this.messageId = messageId;
        this.resetDoneDate = resetDoneDate;
    }
}
