import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { HostedLndType } from './domain/model/lnd/hosted/hosted-lnd-type';
import { createLnd } from './domain/services/lnd/create-user-lnd-service';
import { lndGenSeed, lndGetInfo, lndUnlockWallet } from './domain/services/lnd/api/lnd-api-service';

// Create a new express app instance
export const routingControllersOptions = {
    controllers: [`${__dirname}/interfaces/**/*`],
    authorizationChecker: authorizeRequest,
};

const app = createExpressServer(routingControllersOptions);

app.listen(getNumberProperty('APP_PORT'),   () => {
    logInfo('App is listening on port 3001!');
});

// createLnd('peerzet3@gmail.com', {
//     wumboChannels: true,
//     lnAlias: 'KILLEM ALL',
//     lndHostedType: HostedLndType.STANDARD,
// });
exports.express = app;
// tslint:disable-next-line
// lndUnlockWallet('https://174.138.5.158/lnd-rest/btc', 'dupa');

lndGetInfo('https://174.138.15.123/lnd-rest/btc',
    Buffer.from('AgEDbG5kAvgBAwoQ6M7SO9BOO4bfR09QNF3FjhIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgfrZcVZGjAyxGeZbjS2PMIj5c8Aqi3i87fuSvjXnQvQ0=', 'base64').toString('hex'));
