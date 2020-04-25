import type { Message } from 'telegram-typings'
import { model } from '../models'
import { telegramClient } from './client'
import { isAdmin, isUrl } from './validator'
import { buildOpml } from '../utils/build-opml'

const actions = new Map<string, (arg: string, msg: Message) => Promise<void>>()

export const execute = async (cmd: string, args: string, msg: Message) => {
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

actions.set('/list', async (_arg: string, msg: Message) => {
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const feeds = await model.getFeedByUser(user.id)
    const text =
        feeds.length > 0
            ? feeds.map((feed) => feed.url).join('\n')
            : 'the feed list is empty'
    await telegramClient.send('sendMessage', {
        disable_web_page_preview: true,
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text,
    })
})

actions.set('/export', async (_arg: string, msg: Message) => {
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const feeds = await model.getFeedByUser(user.id)
    if (feeds.length > 0) {
        const opml = buildOpml(feeds)
        await telegramClient.sendFile(
            'sendDocument',
            {
                chat_id: chatId,
                reply_to_message_id: msg.message_id,
                document: Buffer.from(opml),
            },
            { field: 'document', name: 'feed.opml', type: 'application/xml' },
        )
    } else {
        await telegramClient.send('sendMessage', {
            chat_id: chatId,
            reply_to_message_id: msg.message_id,
            text: 'the feed list is empty',
        })
    }
})

actions.set('/add', async (arg: string, msg: Message) => {
    if (!(await isAdmin(msg))) return
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const urls = arg.split(/\s+/).filter(isUrl)
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
    if (!(await isAdmin(msg))) return
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(chatId)
    const urls = arg.split(/\s+/).filter(isUrl)
    await model.unsubscribeUrls(user.id, urls)
    const text = urls.map((u) => `${u} deleted`).join('\n') || 'nothing to do'
    await telegramClient.send('sendMessage', {
        disable_web_page_preview: true,
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text,
    })
})
