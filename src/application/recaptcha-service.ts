import { logError } from './logging-service';

const reCAPTCHA = require('recaptcha2');

const recaptcha = new reCAPTCHA({
    siteKey: '6LdZB6kZAAAAAFOzV7n5GyDE97LZUNp4YNlDKraf',
    secretKey: '6LdZB6kZAAAAAEsE43-3FFNo4CTtYbbLwIC1d7rK',
    ssl: true,
});

export const verifyCaptcha = async (captchaCode: string): Promise<boolean> => {
    try {
        await recaptcha.validate(captchaCode);
        return true;
    } catch (err) {
        logError(`Recaptcha validation error for code ${captchaCode}`, err);
        return false;
    }
};
