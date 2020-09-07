export class LndRun {
    userDomain: string;
    runStartDate: string;

    constructor(domainName: string, runStartDate: string) {
        this.userDomain = domainName;
        this.runStartDate = runStartDate;
    }
}
