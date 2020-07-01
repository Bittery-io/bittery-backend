const md5 = require('md5');

export const getMd5 = (data: string) => {
    return md5(data);
};
