import * as Joi from '@hapi/joi'
import { Update, Message } from 'telegram-typings'
import { telegramClient } from '../utils/telegram'
import { model } from '../models'

const urlValidator = Joi.string().uri({ scheme: ['http', 'https'] })
const isValidUrl = (url: string) =>
    urlValidator.validate(url).error === undefined

const actions = new Map<string, (arg: string, msg: Message) => Promise<void>>()

actions.set('/list', async (_arg: string, msg: Message) => {
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const feeds = await model.getFeedByUser(user.id)
    const text =
        feeds.length > 0 ? feeds.map((feed) => feed.url).join('\n') : 'empty'
    await telegramClient.send('sendMessage', {
        disable_web_page_preview: true,
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text,
    })
})

actions.set('/add', async (arg: string, msg: Message) => {
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const urls = arg.split(/\s+/).filter(isValidUrl)
    await model.subscribeUrls(user.id, urls)
    const text = urls.map((u) => `${u} added`).join('\n') || 'nothing to do'
    await telegramClient.send('sendMessage', {
        disable_web_page_preview: true,
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text,
    })
})

actions.set('/del', async (arg: string, msg: Message) => {
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const urls = arg.split(/\s+/).filter(isValidUrl)
    await model.unsubscribeUrls(user.id, urls)
    const text = urls.map((u) => `${u} deleted`).join('\n') || 'nothing to do'
    await telegramClient.send('sendMessage', {
        disable_web_page_preview: true,
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text,
    })
})

const execute = async (cmd: string, args: string, msg: Message) => {
    const act = actions.get(cmd)
    if (act !== undefined) {
        await act(args, msg)
    } else {
        await telegramClient.send('sendMessage', {
            chat_id: msg.chat.id,
            reply_to_message_id: msg.message_id,
            text: `unknown command: ${cmd}`,
        })
    }
}

const handleMsg = async (msg: Message | undefined) => {
    if (!msg || !msg.text || !msg.entities) return
    const text = msg.text
    const commands = msg.entities
        .filter((entity) => entity.type === 'bot_command')
        .map((entity) => {
            const cmds = text.substr(entity.offset, entity.length).split('@')
            if (
                cmds.length === 1 ||
                (cmds.length === 2 && cmds[1] === 'FeedBoxBot')
            ) {
                return { cmd: cmds[0], off: entity.offset, len: entity.length }
            } else {
                return null
            }
        })
        .filter(Boolean) as { cmd: string; off: number; len: number }[]

    const tasks: Promise<void>[] = []

    let i = 0
    while (i < commands.length) {
        const command = commands[i]
        const nextOffset =
            i + 1 < commands.length ? commands[i + 1].off : text.length
        const args = text.substring(command.off + command.len, nextOffset)
        tasks.push(execute(command.cmd, args, msg))
        i++
    }

    await Promise.all(tasks)
}

export const webhook = {
    auth: false,
    validate: {
        payload: Joi.object().required(),
    },
    async handler(request, _h) {
        const payload: Update = request.payload

        await Promise.all([
            handleMsg(payload.message),
            handleMsg(payload.edited_message),
            handleMsg(payload.channel_post),
            handleMsg(payload.edited_channel_post),
            // handleCallback(payload.callback_query),
        ])

        return 'ok'
    },
}
