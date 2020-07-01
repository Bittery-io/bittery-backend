export const getProperty = (propertyName: string): string => {
    return <string>process.env[`${propertyName}`];
};

export const getNumberProperty = (propertyName: string): number => {
    return Number(process.env[`${propertyName}`]);
};

export const getBooleanProperty = (propertyName: string): boolean => {
    return Boolean(process.env[`${propertyName}`]);
};

export const getArrayProperty = (propertyName: string): string[] => {
    return JSON.parse(<string>process.env[`${propertyName}`]);
};
