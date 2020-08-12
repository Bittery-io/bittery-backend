import { getBooleanProperty, getProperty } from './property-service';

export const isDevelopmentEnv = (): boolean => {
    return getBooleanProperty('IS_DEVELOPMENT_ENV');
};

export const getDevelopmentHostName = (): string => {
    return getProperty('DEVELOPMENT_HOSTNAME');
};
