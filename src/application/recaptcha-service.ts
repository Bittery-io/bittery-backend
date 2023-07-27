import { logError } from './logging-service';
import { getProperty } from './property-service';

const reCAPTCHA = require('recaptcha2');

const recaptcha = new reCAPTCHA({
    siteKey: getProperty('RECAPTCHA_SITE_KEY'),
    secretKey: getProperty('RECAPTCHA_SECRET_KEY'),
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
