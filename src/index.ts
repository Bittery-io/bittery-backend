import { authorizeRequest } from './domain/services/auth/access-authorization-service';
import { logInfo } from './application/logging-service';
import { getNumberProperty } from './application/property-service';
import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import { createLndDroplet } from './domain/services/lnd/provisioning/lnd-digital-ocean-provision-service';
import 'ts-replace-all';
import { LndType } from './domain/model/lnd/lnd-type';

require('./domain/services/lnd-run-schedule/lnd-run-schedule-service');

// Create a new express app instance
export const routingControllersOptions = {
    controllers: [`${__dirname}/interfaces/**/*`],
    authorizationChecker: authorizeRequest,
};

const app = createExpressServer(routingControllersOptions);

app.listen(getNumberProperty('APP_PORT'),   () => {
    logInfo('App is listening on port 3001!');
});

createLndDroplet('wujekpompa', LndType.STANDARD);

exports.express = app;
