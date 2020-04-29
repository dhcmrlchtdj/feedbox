import '../init-env'
import Mailgun from 'mailgun-js'
import { report } from './error-reporter'

const mailgun = new Mailgun({
    apiKey: process.env.MAILGUN_API_KEY!,
    domain: process.env.MAILGUN_DOMAIN!,
})

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
            await mailgun.messages().send(data)
            return true
        } catch (err) {
            report.err(err)
            return false
        }
    } else {
        console.log(addr, subject)
        return true
    }
}
