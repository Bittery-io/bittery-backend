export class LndRunRequest {
    userDomain: string;
    runRequestDate: string;

    constructor(domainName: string, runRequestDate: string) {
        this.userDomain = domainName;
        this.runRequestDate = runRequestDate;
    }
}
