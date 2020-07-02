const passwordLength: number = 6;
export const validatePlainPassword = async (password: string): Promise<void> => {
    if (!password || password === '') {
        return Promise.reject(new Error('Plain password validation failed because is null or empty!'));
    }
    if (password.length < passwordLength) {
        return Promise.reject(new Error(`Password length must be greater or equal ${passwordLength}`));
    }
};

export const validatePlainPasswords = async (password: string, repeatPassword: string): Promise<void> => {
    if (password !== repeatPassword) {
        return Promise.reject(new Error('Plain passwords validation failed!'));
    }
};
