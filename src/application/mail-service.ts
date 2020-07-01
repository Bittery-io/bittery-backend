import { getProperty } from './property-service';
const mailgun = require('mailgun-js');

const apiKey = getProperty('MAILGUN_API_KEY');
const domain = 'mail.bittery.io';
const mg = mailgun({ domain, apiKey, host: 'api.eu.mailgun.net' });

export const sendRegistrationEmail = async (toEmail: string, signUpKey: string): Promise<string | undefined> => {
    const url = `${getProperty('CLIENT_URL_ADDRESS')}/#/register/confirm?signUpKey=${signUpKey}&email=${toEmail}`;
    const body: string = `
    <html>
    <body>
    <h2>Welcome to Bittery.io - better Bitcoin payments</h2>
    <br>
    <p>Thank you for joining Bittery.</a></p>
    <p>Let's change payments together.</a></p><br>
    <p>Your username is: <b>${toEmail}</b></p>
    <p>In order to finish registration process and activate your account, please open given link: <a href='${url}'>${url}</a></p>
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
        subject: 'Welcome to Bittery.io',
        html: body,
    };
    try {
        const sendResponse = await mg.messages().send(data);
        console.log(sendResponse);
        console.log(`Successfully sent registration email to ${toEmail}`);
        return sendResponse.id;
    } catch (err) {
        console.log(`Sending registration email to ${toEmail} failed!`, err);
        return undefined;
    }
};
