import * as Mailgun from "mailgun-js";

const mg = new Mailgun({
    apiKey: process.env.MAILGUN_API_KEY as string,
    domain: process.env.MAILGUN_DOMAIN as string,
});

const send = async (
    addr: string,
    subject: string,
    text: string,
): Promise<void> => {
    const data = {
        from: process.env.MAILGUN_FROM,
        to: [addr],
        subject,
        text,
        html: text,
    };
    try {
        await mg.messages().send(data);
    } catch (err) {
        console.error(err);
    }
};

export default send;
