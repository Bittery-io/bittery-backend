export const generateBtcPayLndAddress = (userDomain: string): string => {
    return `type=lnd-rest;server=https://${userDomain}_lnd_bitcoin:8080/;macaroonfilepath=/etc/lnd_bitcoin/${userDomain}/bitcoin/datadir/admin.macaroon;allowinsecure=true`;
};

export const generateBtcPayCustomLndAddress = (lndRestAddress: string, macaroonHex: string, tlsCertThumbprint: string): string => {
    return `type=lnd-rest;server=${lndRestAddress};macaroon=${macaroonHex};certthumbprint=${tlsCertThumbprint}`;
};

// tslint:disable-next-line:max-line-length
// type=lnd-rest;server=https://emergencja:445/lnd-rest/btc/;macaroon=0201036c6e6402eb01030a101f21af6325069b9ff3aba375ab42cf191201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a140a086d616361726f6f6e120867656e65726174651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620f2ccacf447e437c16fd89a10ae24e79fca2986f5843601631e6b4a08cf526168;certthumbprint=F2CCE163356E12F45E7946F2EF2E17D8F19718133D6B3156322D44CF76777614
// type=lnd-rest;server=http://emergenc:8080/;macaroonfilepath=/etc/lnd_bitcoin/emergencja/bitcoin/datadir/admin.macaroon;allowinsecure=true
