import * as Mailgun from 'mailgun-js';

const apiKey = 'TODO';
const domain = 'TODO';
const mailgun = Mailgun({ apiKey, domain });
const messages = mailgun.messages();

const sender = 'TODO';
const email = async (receiver: string, subject: string, text: string) => {
    var data = {
        from: sender,
        to: receiver,
        subject,
        text,
    };

    const p = new Promise((resolve, reject) => {
        messages.send(data, (err, body) => {
            if (err) reject(err);
            resolve(body);
        });
    });

    return p;
};

export default email;
