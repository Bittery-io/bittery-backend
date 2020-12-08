export class LndInfo {
    publicKey: string;
    uri: string;
    syncedToChain: boolean;
    syncedToGraph: boolean;
    numPeers: number;
    numInactiveChannels: number;
    numActiveChannels: number;
    numPendingChannels: number;
    version: number;
    alias?: string;

    constructor(publicKey: string, uri: string, syncedToChain: boolean, syncedToGraph: boolean, numPeers: number,
                numInactiveChannels: number, numActiveChannels: number, numPendingChannels: number,
                version: number, alias?: string) {
        this.publicKey = publicKey;
        this.uri = uri;
        this.syncedToChain = syncedToChain;
        this.syncedToGraph = syncedToGraph;
        this.numPeers = numPeers;
        this.numInactiveChannels = numInactiveChannels;
        this.numActiveChannels = numActiveChannels;
        this.numPendingChannels = numPendingChannels;
        this.version = version;
        this.alias = alias;
    }
}
