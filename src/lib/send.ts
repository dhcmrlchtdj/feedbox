import * as Mailgun from 'mailgun-js';

const mailgun = new Mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
});
const messages = mailgun.messages();

const sender = process.env.MAILGUN_SENDER;
const email = async (receiver: string, subject: string, text: string) => {
    const data = {
        from: sender,
        to: receiver,
        subject,
        text,
    };

    const resp = await messages.send(data);

    return resp;
};

export default email;
