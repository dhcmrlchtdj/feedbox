import { parse } from 'fast-xml-parser'
import * as Joi from '@hapi/joi'

const schema = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()

export default (str: string): string[] => {
    let xml
    try {
        xml = parse(str.trim(), { ignoreAttributes: false }, true)
    } catch (err) {
        return []
    }

    const outline = xml?.opml?.body?.outline
    const linkSet = new Set<string | undefined>()
    if (Array.isArray(outline)) {
        outline.forEach(o => linkSet.add(o['@_xmlUrl']))
    } else if (outline !== undefined) {
        linkSet.add(outline['@_xmlUrl'])
    }

    const links = Array.from(linkSet).filter(link => {
        const { error } = schema.validate(link)
        return error === undefined
    }) as string[]

    return links
}
