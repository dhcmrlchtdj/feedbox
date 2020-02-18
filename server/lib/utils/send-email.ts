import * as Mailgun from 'mailgun-js'
import { rollbar } from './rollbar'
import { lazy } from './lazy'

const mg = lazy(
    () =>
        new Mailgun({
            apiKey: process.env.MAILGUN_API_KEY!,
            domain: process.env.MAILGUN_DOMAIN!,
        }),
)

const send = async data =>
    mg()
        .messages()
        .send(data)
const debug = async data => console.log(data.to, data.subject)
const used = process.env.NODE_ENV === 'production' ? send : debug

export const sendEmail = async (
    addr: string,
    subject: string,
    text: string,
) => {
    const data = {
        from: process.env.MAILGUN_FROM,
        to: [addr],
        subject,
        text,
        html: text,
    }
    try {
        await used(data)
    } catch (err) {
        rollbar.error(err)
    }
}
