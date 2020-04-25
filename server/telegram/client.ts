import type { InlineKeyboardMarkup } from 'telegram-typings'
import fetch from 'node-fetch'
import type { Response } from 'node-fetch'
import FormData from 'form-data'

export class TelegramClient {
    private token: string
    constructor(token: string) {
        this.token = token
    }

    async send(type: 'getChatMember', data: GetChatMember): Promise<Response>
    async send(type: 'setWebhook', data: SetWebhook): Promise<Response>
    async send(type: 'sendMessage', data: SendMessage): Promise<Response>
    async send(type: 'sendPhoto', data: SendPhoto): Promise<Response>
    async send(type: 'sendAnimation', data: SendAnimation): Promise<Response>
    async send(type: 'sendVideo', data: SendVideo): Promise<Response>
    async send(type: 'setMyCommands', data: SetMyCommands): Promise<Response>
    async send(
        type: 'answerCallbackQuery',
        data: AnswerCallbackQuery,
    ): Promise<Response>
    async send(type: string, data: Record<string, unknown>): Promise<Response> {
        const url = `https://api.telegram.org/bot${this.token}/${type}`
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        return resp
    }

    async sendFile(
        type: 'sendDocument',
        data: SendDocumentBuffer,
        file: { field: 'document'; name: string; type: string },
    ): Promise<Response>
    async sendFile(
        type: string,
        data: Record<string, unknown>,
        file: { field: string; name: string; type: string },
    ): Promise<Response> {
        const form = new FormData()
        Object.entries(data).forEach(([k, v]) => {
            if (k === file.field) {
                form.append(k, v, {
                    filename: file.name,
                    contentType: file.type,
                })
            } else {
                form.append(k, v)
            }
        })

        const url = `https://api.telegram.org/bot${this.token}/${type}`
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                ...form.getHeaders(),
            },
            body: form.getBuffer(),
        })
        return resp
    }
}

export const telegramClient = new TelegramClient(
    process.env.TELEGRAM_BOT_TOKEN!,
)
type SendDocumentBuffer = {
    chat_id: number
    document: Buffer
    thumb?: string
    caption?: string
    parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown'
    disable_notification?: boolean
    reply_to_message_id?: number
    reply_markup?: InlineKeyboardMarkup
}

type BotCommand = {
    // Text of the command, 1-32 characters. Can contain only lowercase English letters, digits and underscores.
    command: string
    // Description of the command, 3-256 characters.
    description: string
}

type SetMyCommands = {
    commands: BotCommand[]
}

type GetChatMember = {
    chat_id: number
    user_id: number
}
type SetWebhook = {
    url: string
    max_connections?: number
    allowed_updates?: string[]
}
type SendMessage = {
    chat_id: number
    text: string
    parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown'
    disable_web_page_preview?: boolean
    disable_notification?: boolean
    reply_to_message_id?: number
    reply_markup?: InlineKeyboardMarkup
}
type SendPhoto = {
    chat_id: number
    photo: string // file_id
    caption?: string
    parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown'
    disable_notification?: boolean
    reply_to_message_id?: number
    reply_markup?: InlineKeyboardMarkup
}
type SendAnimation = {
    chat_id: number
    animation: string // file_id
    duration?: number
    width?: number
    height?: number
    thumb?: string // file_id
    caption?: string
    parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown'
    disable_notification?: boolean
    reply_to_message_id?: number
    reply_markup?: InlineKeyboardMarkup
}
type SendVideo = {
    chat_id: number
    video: string // file_id
    duration?: number
    width?: number
    height?: number
    thumb?: string // file_id
    caption?: string
    parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown'
    supports_streaming?: boolean
    disable_notification?: boolean
    reply_to_message_id?: number
    reply_markup?: InlineKeyboardMarkup
}
type AnswerCallbackQuery = {
    callback_query_id: string
    text?: string
    show_alert?: boolean
    url?: string
    cache_time?: number
}
