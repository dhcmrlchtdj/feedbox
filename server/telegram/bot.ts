import type { Update, Message } from 'telegram-typings'
import { telegramClient } from './client'
import { execute } from './command'

const extractCommands = (
    msg: Message | undefined,
    botName: string,
): { cmd: string; arg: string }[] => {
    if (!msg || !msg.text || !msg.entities) return []
    const text = msg.text
    const commands = msg.entities
        .filter((entity) => entity.type === 'bot_command')
        .map((entity) => {
            const cmds = text.substr(entity.offset, entity.length).split('@')
            if (
                cmds.length === 1 ||
                (cmds.length === 2 && cmds[1] === botName)
            ) {
                return { cmd: cmds[0], off: entity.offset, len: entity.length }
            } else {
                return null
            }
        })
        .filter(Boolean) as { cmd: string; off: number; len: number }[]

    const cmds: { cmd: string; arg: string }[] = []
    let i = 0
    while (i < commands.length) {
        const command = commands[i]
        const nextOffset =
            i + 1 < commands.length ? commands[i + 1].off : text.length
        const arg = text.substring(command.off + command.len, nextOffset)
        cmds.push({ cmd: command.cmd, arg })
        i++
    }
    return cmds
}

const handleMsg = async (msg: Message | undefined) => {
    const cmds = extractCommands(msg, 'FeedBoxBot')
    const tasks = cmds.map((cmd) => execute(cmd.cmd, cmd.arg, msg!))
    await Promise.all(tasks)
}

export const telegramBot = {
    registerWebhook: async () => {
        await Promise.all([
            telegramClient.send('setWebhook', {
                url: `${process.env.SERVER}/webhook/telegram/${process.env.TELEGRAM_WEBHOOK_PATH}`,
            }),
            telegramClient.send('setMyCommands', {
                commands: [
                    { command: 'list', description: 'list all feeds' },
                    { command: 'add', description: '[url] subscribe urls' },
                    { command: 'del', description: '[url] unsubscribe urls' },
                    {
                        command: 'export',
                        description: 'export feed list as OPML',
                    },
                ],
            }),
        ])
    },
    handleWebhook: async (payload: Update) => {
        await Promise.all([
            handleMsg(payload.message),
            handleMsg(payload.edited_message),
            handleMsg(payload.channel_post),
            handleMsg(payload.edited_channel_post),
            // handleCallback(payload.callback_query)
        ])
    },
}
