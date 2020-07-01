export class UserConfirmation {
    userEmail: string;
    signUpKey: string;
    confirmed: boolean;
    messageId: string;
    creationDate: string;
    confirmationDate?: string;

    constructor(userEmail: string, signUpKey: string, confirmed: boolean, messageId: string,
                creationDate: string, confirmationDate?: string) {
        this.userEmail = userEmail;
        this.signUpKey = signUpKey;
        this.confirmed = confirmed;
        this.messageId = messageId;
        this.creationDate = creationDate;
        this.confirmationDate = confirmationDate;
    }
}
