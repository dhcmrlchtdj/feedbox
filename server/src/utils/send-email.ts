import * as Mailgun from "mailgun-js";

const mailgun = new Mailgun({
    apiKey: process.env.MAILGUN_API_KEY as string,
    domain: process.env.MAILGUN_DOMAIN as string,
});
const messages = mailgun.messages();

const sender = process.env.MAILGUN_SENDER;

const send = async (receiver: string, subject: string, text: string) => {
    const data = {
        from: sender,
        to: receiver,
        subject,
        text,
    };

    const resp = await messages.send(data);

    return resp;
};

export default send;
