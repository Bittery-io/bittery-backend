export class LndInfo {
    publicKey: string;
    syncedToChain: boolean;
    syncedToGraph: boolean;
    numPeers: number;
    numInactiveChannels: number;
    numActiveChannels: number;
    numPendingChannels: number;
    version: string;
    uri: string;
    alias?: string;

    constructor(publicKey: string, syncedToChain: boolean, syncedToGraph: boolean, numPeers: number,
                numInactiveChannels: number, numActiveChannels: number, numPendingChannels: number,
                version: string, uri:string, alias?: string) {
        this.publicKey = publicKey;
        this.syncedToChain = syncedToChain;
        this.syncedToGraph = syncedToGraph;
        this.numPeers = numPeers;
        this.numInactiveChannels = numInactiveChannels;
        this.numActiveChannels = numActiveChannels;
        this.numPendingChannels = numPendingChannels;
        this.version = version;
        this.uri = uri;
        this.alias = alias;
    }
}
