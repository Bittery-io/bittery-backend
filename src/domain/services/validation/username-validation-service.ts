export const validateUsername = async (username: string): Promise<void> => {
    if (!username || username === '') {
        return Promise.reject(new Error(`Username '${username}' is incorrect.`));
    }
};
