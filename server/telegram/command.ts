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
    }
}

actions.set('/list', async (_arg: string, msg: Message) => {
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(String(chatId))
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
    const user = await model.getOrCreateUserByTelegram(String(chatId))
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
            {
                document: {
                    filename: 'feed.opml',
                    contentType: 'application/xml',
                },
            },
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
    const user = await model.getOrCreateUserByTelegram(String(chatId))
    const urls = arg.split(/\s+/).filter(isUrl)
    let text = 'Usage: /add url'
    if (urls.length > 0) {
        const c = await model.subscribeUrls(user.id, urls)
        if (c <= 1) {
            text = `add ${c} feed`
        } else {
            text = `add ${c} feeds`
        }
    }
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
    const user = await model.getOrCreateUserByTelegram(String(chatId))
    const urls = arg.split(/\s+/).filter(isUrl)
    let text = 'Usage: /del url'
    if (urls.length > 0) {
        const c = await model.unsubscribeUrls(user.id, urls)
        if (c <= 1) {
            text = `delete ${c} feed`
        } else {
            text = `delete ${c} feeds`
        }
    }
    await telegramClient.send('sendMessage', {
        disable_web_page_preview: true,
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text,
    })
})

actions.set('/del_all', async (_arg: string, msg: Message) => {
    if (!(await isAdmin(msg))) return
    const chatId = msg.chat.id
    const user = await model.getOrCreateUserByTelegram(String(chatId))
    const feeds = await model.getFeedByUser(user.id)
    if (feeds.length > 0) {
        await model.unsubscribeAll(user.id)
        const opml = buildOpml(feeds)
        await telegramClient.sendFile(
            'sendDocument',
            {
                chat_id: chatId,
                reply_to_message_id: msg.message_id,
                document: Buffer.from(opml),
                caption: 'done',
            },
            {
                document: {
                    filename: 'backup.opml',
                    contentType: 'application/xml',
                },
            },
        )
    } else {
        await telegramClient.send('sendMessage', {
            chat_id: chatId,
            reply_to_message_id: msg.message_id,
            text: 'the feed list is empty',
        })
    }
})
