const { v4: uuidv4 } = require('uuid');

export const generateUuid = () => {
    return uuidv4();
};
