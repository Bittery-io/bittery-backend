import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getBooleanProperty, getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { startSubscriptionDisableScheduler } from './domain/services/subscription/subscription-disabler-scheduler';
import { startSubscriptionRenewEmailScheduler } from './domain/services/subscription/subscription-renew-email-scheduler';
import { startStaticChannelBackupScheduler } from './domain/services/lnd/static-channel-backup/static-channel-backup-scheduler-service';

// Create a new express app instance
export const routingControllersOptions = {
    controllers: [`${__dirname}/interfaces/**/*`],
    authorizationChecker: authorizeRequest,
};

const app = createExpressServer(routingControllersOptions);

if (getBooleanProperty('RUN_STATIC_CHANNEL_BACKUP_SCHEDULER')) {
    // startStaticChannelBackupScheduler();
}
if (getBooleanProperty('RUN_SUBSCRIPTION_DISABLE_SCHEDULER')) {
}
startSubscriptionDisableScheduler();
// startStaticChannelBackupScheduler();
if (getBooleanProperty('RUN_SUBSCRIPTION_RENEW_EMAIL_SCHEDULER')) {
    startSubscriptionRenewEmailScheduler();
}

app.listen(getNumberProperty('APP_PORT'),   () => {
    logInfo('App is listening on port 3001!');
});
exports.express = app;
// restoreLnd('peerzet3@gmail.com', '4f205bb9-7703-4fde-a594-c04a3035d67e');
