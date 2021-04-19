import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { startStaticChannelBackupScheduler } from './domain/services/lnd/static-channel-backup/static-channel-backup-scheduler-service';

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
startStaticChannelBackupScheduler();
exports.express = app;
// tslint:disable-next-line
// lndUnlockWallet('https://174.138.5.158/lnd-rest/btc', 'dupa');
