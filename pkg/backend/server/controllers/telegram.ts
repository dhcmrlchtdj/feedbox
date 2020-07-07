import * as Joi from 'joi'
import { telegramBot } from '../telegram/bot'

export const webhook = {
    auth: false,
    validate: {
        payload: Joi.object().required(),
    },
    async handler(request, _h) {
        telegramBot.handleWebhook(request.payload)
        return 'ok'
    },
}
