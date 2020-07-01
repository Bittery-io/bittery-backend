export const validateEmailAddress = async (email: string): Promise<void> => {
    if (!(/\S+@\S+\.\S+/.test(email)) || email.indexOf(' ') !== -1 || email.indexOf('..') !== -1) {
        const errorMessage: string = `Incorrect email address '${email}'!`;
        console.log(errorMessage);
        return Promise.reject(new Error(errorMessage));
    }
};
