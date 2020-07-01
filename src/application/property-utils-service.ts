import { getProperty } from './property-service';

export const isDevelopmentEnv = (): string => {
    return getProperty('IS_DEVELOPMENT_ENV');
};

export const getDevelopmentHostName = (): string => {
    return getProperty('DEVELOPMENT_HOSTNAME');
};
