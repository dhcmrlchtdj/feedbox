import Mailgun from 'mailgun-js'
import { rollbar } from './rollbar'
import { lazy } from '../../util/lazy'

const mg = lazy(
    () =>
        new Mailgun({
            apiKey: process.env.MAILGUN_API_KEY!,
            domain: process.env.MAILGUN_DOMAIN!,
        }),
)

export const sendEmail = async (
    addr: string,
    subject: string,
    text: string,
): Promise<boolean> => {
    if (process.env.NODE_ENV === 'production') {
        const data = {
            from: process.env.MAILGUN_FROM,
            to: [addr],
            subject,
            text,
            html: text,
        }
        try {
            await mg().messages().send(data)
            return true
        } catch (err) {
            rollbar.error(err)
            return false
        }
    } else {
        console.log(addr, subject)
        return true
    }
}
