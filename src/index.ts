import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { HostedLndType } from './domain/model/lnd/hosted/hosted-lnd-type';
import { createLnd } from './domain/services/lnd/create-user-lnd-service';
import { lndBakeMacaroonForBtcPay, lndGenSeed, lndGetInfo, lndUnlockWallet } from './domain/services/lnd/api/lnd-api-service';
import { encodePassword } from './domain/services/user/password-service';

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
