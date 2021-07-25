import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { startSubscriptionDisableScheduler } from './domain/services/billing/subscription-disabler-scheduler';

// Create a new express app instance
export const routingControllersOptions = {
    controllers: [`${__dirname}/interfaces/**/*`],
    authorizationChecker: authorizeRequest,
};

const app = createExpressServer(routingControllersOptions);

app.listen(getNumberProperty('APP_PORT'),   () => {
    logInfo('App is listening on port 3001!');
});

// startStaticChannelBackupScheduler();
// backupLndFolder('d7531d5a-adf9-4b03-9483-d61769817eba', 'peerzet3@gmail.com');
exports.express = app;
// tslint:disable-next-line
// lndUnlockWallet('https://174.138.5.158/lnd-rest/btc', 'dupa');
// subscriptionScheduler();
startSubscriptionDisableScheduler();
