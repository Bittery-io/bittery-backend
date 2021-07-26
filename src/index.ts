import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { startSubscriptionDisableScheduler } from './domain/services/billing/subscription-disabler-scheduler';
import { restoreLnd } from './domain/services/lnd/restore-user-lnd-service';
import { restoreLndInDroplet } from './domain/services/lnd/provisioning/digital-ocean-restore-lnd-service';

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
// startSubscriptionDisableScheduler();
// restoreLnd('peerzet3@gmail.com', '5d6a7e11-da3c-4f40-9624-4cfa738b52d3');
// restoreLndInDroplet('peerzet3@gmail.com', '164.90.193.209', 256384033, 256383402, 'lnd_backup_1627250880082');
