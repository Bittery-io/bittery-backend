import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import 'ts-replace-all';
import { HostedLndType } from './domain/model/lnd/hosted/hosted-lnd-type';
import { createLnd } from './domain/services/lnd/create-user-lnd-service';

// Create a new express app instance
export const routingControllersOptions = {
    controllers: [`${__dirname}/interfaces/**/*`],
    authorizationChecker: authorizeRequest,
};

const app = createExpressServer(routingControllersOptions);

app.listen(getNumberProperty('APP_PORT'),   () => {
    logInfo('App is listening on port 3001!');
});

createLnd('peerzet3@gmail.com', {
    wumboChannels: false,
    lndHostedType: HostedLndType.STANDARD,
});
exports.express = app;
