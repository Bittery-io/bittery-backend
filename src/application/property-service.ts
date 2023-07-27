export const getProperty = (propertyName: string): string => {
    try {
        return <string>process.env[`${propertyName}`];
    } catch (err) {
        console.log(`Error on getting string ENV property: ${propertyName}`, err);
        throw err;
    }
};

export const getNumberProperty = (propertyName: string): number => {
    try {
        return Number(process.env[`${propertyName}`]);
    } catch (err) {
        console.log(`Error on getting number ENV property: ${propertyName}`, err);
        throw err;
    }
};

export const getBooleanProperty = (propertyName: string): boolean => {
    try {
        return JSON.parse(process.env[`${propertyName}`]!);
    } catch (err) {
        console.log(`Error on getting JSON ENV property: ${propertyName}`, err);
        throw err;
    }
};

export const getArrayProperty = (propertyName: string): string[] => {
    return JSON.parse(<string>process.env[`${propertyName}`]);
};
