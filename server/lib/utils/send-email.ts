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
const debug = async _data => {}
const used = process.env.NODE_ENV === 'production' ? send : debug

export const sendEmail = async (
    addr: string,
    subject: string,
    text: string,
) => {
    console.debug('sending', addr, subject)
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

export const sendEmails = async (
    mails: {
        addr: string
        subject: string
        text: string
    }[],
) => {
    const tasks = mails.map(x => sendEmail(x.addr, x.subject, x.text))
    await Promise.allSettled(tasks)
}
