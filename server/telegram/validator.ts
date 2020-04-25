import type { Message, ChatMember } from 'telegram-typings'
import * as Joi from '@hapi/joi'
import { telegramClient } from './client'

export const isAdmin = async (msg: Message): Promise<boolean> => {
    const type = msg.chat.type
    if (type === 'group' || type === 'supergroup') {
        const resp = await telegramClient.send('getChatMember', {
            chat_id: msg.chat.id,
            user_id: msg.from!.id,
        })
        const member: ChatMember = await resp.json()
        return member.status === 'creator' || member.status === 'administrator'
    }
    // if (type === 'private' || type === 'channel') return true
    return true
}

const urlValidator = Joi.string().uri({ scheme: ['http', 'https'] })
export const isUrl = (url: string) =>
    urlValidator.validate(url).error === undefined
