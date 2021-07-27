import { getProperty } from './property-service';
import { logError, logInfo } from './logging-service';
import { DigitalOceanLndDeploymentStageType } from '../domain/model/lnd/hosted/digital_ocean/digital-ocean-lnd-deployment-stage-type';
import { formatDateWithTime } from '../domain/services/utils/date-service';
import { DisableSubscriptionException } from '../domain/model/subscription/disable-subscription-exception';
const mailgun = require('mailgun-js');

const apiKey = getProperty('MAILGUN_API_KEY');
const domain = 'mail.bittery.io';
const mg = mailgun({ domain, apiKey, host: 'api.eu.mailgun.net' });

export const sendRegistrationEmail = async (toEmail: string, signUpKey: string): Promise<string | undefined> => {
    const url = `${getProperty('CLIENT_URL_ADDRESS')}/register/confirm?signUpKey=${signUpKey}&email=${toEmail}`;
    const body: string = `
    <html>
    <body>
    <h2>Welcome to Bittery.io - better Bitcoin payments</h2>
    <br>
    <p>Thank you for joining Bittery.</a></p>
    <p>Your username is: <b>${toEmail}</b></p>
    <p>In order to finish registration process and activate your account, please confirm your registration: </p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td>
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td bgcolor="#001f10" style="padding: 12px 18px 12px 18px; border-radius:3px" align="center">
              <a href="${url}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; font-weight: normal; color: #ffffff; text-decoration: none; display: inline-block;">Confirm registration &rarr;</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <br><br>
    --------------------------------------------------- <br>
      Bittery.io<br>
      Website: <a href='https://bittery.io'> https://bittery.io </a> <br>
      E-mail: bitteryio@protonmail.com <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: toEmail,
        subject: 'Welcome to Bittery.io',
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo(`Successfully sent registration email to ${toEmail}. ${sendResponse}`);
        return sendResponse.id;
    } catch (err) {
        logError(`Sending registration email to ${toEmail} failed!`, err);
        return undefined;
    }
};

export const sendResetPasswordEmail = async (toEmail: string, resetPasswordEmail: string): Promise<string | undefined> => {
    const url = `${getProperty('CLIENT_URL_ADDRESS')}/password/reset/confirm?resetKey=${resetPasswordEmail}&email=${toEmail}`;
    const body: string = `
    <html>
    <body>
    <h2>Password reset request - Bittery.io</h2>
    <br>
    <p>We received password reset request for the Bittery.io account registered with given email.</p>
    <b>Please ignore the message if you consider it's any kind of mistake.<a></b><br>
    <p>In order to proceed reset password process, please open given link: <a href='${url}'>${url}</a></p>
    <p>The link will be valid for limited period of time.></p>
    <br><br>
    --------------------------------------------------- <br>
      Bittery.io<br>
      Website: <a href='https://bittery.io'> https://bittery.io </a> <br>
      E-mail: office@bittery.io <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: toEmail,
        subject: 'Password reset request - Bittery.io',
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo(`Successfully sent password reset email to ${toEmail}. ${sendResponse}`);
        return sendResponse.id;
    } catch (err) {
        logError(`Sending password reset email to ${toEmail} failed!`, err);
        return undefined;
    }
};

export const sendUserRegisterMail = async (usersCounter: number): Promise<string | undefined> => {
    const body: string = `
    <html>
    <body>
    <h2>Nowy user w Bittery. Suma: ${usersCounter}</h2>
    <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: getProperty('EMAIL_FOR_ADMIN_NOTIFICATIONS'),
        subject: 'Nowy user w Bittery',
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo('Sent user registered mail');
        return sendResponse.id;
    } catch (err) {
        logError(`User register mail send failed`, err);
        return undefined;
    }
};

export const sendSetupLndFailedForUserEmail = async (
        failedForUserEmail: string,
        deploymentStage: DigitalOceanLndDeploymentStageType,
        errorMessage?: string): Promise<string | undefined> => {
    const body: string = `
    <html>
    <body>
    <h3>Użytkownik ${failedForUserEmail} tworzył droplet, ale nie udało się. Błąd: ${deploymentStage}.<h3>
    <h3>Godzina: ${formatDateWithTime(new Date().getTime())}<h3>
    <h3>Szczegóły błędu: ${errorMessage ?? 'brak'}<h3>
    <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: getProperty('EMAIL_FOR_ADMIN_NOTIFICATIONS'),
        subject: 'Tworzenie dropletu nie udało się Bittery.io',
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo('Droplet provision failed mail sent');
        return sendResponse.id;
    } catch (err) {
        logError(`Droplet provision mail send failed`, err);
        return undefined;
    }
};

export const sendDisablingSubscriptionFailed = async (
        failedForUserEmail: string,
        failedForLndId: string,
        disableSubscriptionException: DisableSubscriptionException): Promise<string | undefined> => {
    const body: string = `
    <html>
    <body>
    <h3>Nie udało się wyłączyć subskrypcji (w tym może usunąć dropletu) dla usera ${failedForUserEmail} i lnd id ${failedForLndId}. Błąd: ${disableSubscriptionException.failedDeploymentStage}.<h3>
    <h3>Godzina: ${formatDateWithTime(new Date().getTime())}<h3>
    <h3>Szczegóły błędu: ${disableSubscriptionException.message}<h3>
    <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: getProperty('EMAIL_FOR_ADMIN_NOTIFICATIONS'),
        subject: 'Błąd wyłączania subskrypcji dla użytkownika w Bittery.io',
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo('Sent disable user subscription failed mail');
        return sendResponse.id;
    } catch (err) {
        logError(`Disable user subscription mail send failed`, err);
        return undefined;
    }
};

// tslint:disable-next-line:max-line-length
export const sendSubscriptionEndsSoonEmail = async (toEmail: string, subscriptionDaysLeft: number, subscriptionEndDate: Date): Promise<string | undefined> => {
    const url = `${getProperty('CLIENT_URL_ADDRESS')}/account`;
    const body: string = `
    <html>
    <body>
    <h2>Bittery.io - better Bitcoin payments subscription ends in ${subscriptionDaysLeft} days</h2>
    <p>Your Bittery.io subscription ends at: <b>${formatDateWithTime(subscriptionEndDate.getTime())}</b></p>
    <p>Please extend your subscription otherwise it will be disabled.</b></p>
    <p style="color: red">Your personal Lightning Network node will be <b>turned off and archived</b>. You will not be able to access the node anymore and your payment services will be disabled.</p>
    <p style="color: red">If you decide not extend subscription - please <b>remove your funds from the node until it is running</b> (close channels and withraw on-chain funds).</p>
    <p>You can <b>extend your subscription</b> here: <a href='${url}'>${url}</a></p>
    <br><br>
    --------------------------------------------------- <br>
      Bittery.io<br>
      Website: <a href='https://bittery.io'> https://bittery.io </a> <br>
      E-mail: bitteryio@protonmail.com <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: toEmail,
        subject: `Your Bittery.io subscription ends in ${subscriptionDaysLeft} days.`,
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo(`Successfully sent subscription ends in ${subscriptionDaysLeft} days email to ${toEmail}. ${sendResponse}`);
        return sendResponse.id;
    } catch (err) {
        logError(`Sending subscription ends in ${subscriptionDaysLeft} days email to ${toEmail} failed`, err);
        return undefined;
    }
};

export const subscriptionEndedEmail = async (toEmail: string): Promise<string | undefined> => {
    const url = `${getProperty('CLIENT_URL_ADDRESS')}/subscribe`;
    const body: string = `
    <html>
    <body>
    <h2>Bittery.io - better Bitcoin payments subscription just ended</h2>
    <p>Your Bittery.io subscription just ended. You can still sign in but your payment services are now disabled.</p>
    <p style="color: red">Your personal Lightning Network Node is turned off and archived.</p>
    <p>You can <b>renew your subscription</b> anytime here: <a href='${url}'>${url}</a></p>
    <br><br>
    --------------------------------------------------- <br>
      Bittery.io<br>
      Website: <a href='https://bittery.io'> https://bittery.io </a> <br>
      E-mail: bitteryio@protonmail.com <br><br>
    </body>
    </html>`;
    const data = {
        from: 'Bittery.io <notifications@mail.bittery.io>',
        to: toEmail,
        subject: `Your Bittery.io subscription just ended`,
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        logInfo(`Successfully sent subscription ended email to ${toEmail}. ${sendResponse}`);
        return sendResponse.id;
    } catch (err) {
        logError(`Sending subscription ended email to ${toEmail} failed`, err);
        return undefined;
    }
};
