import * as fs from 'fs'
import * as path from 'path'

const { mkdir, writeFile, readFile } = fs.promises
const readStr = async p => (await readFile(p)).toString()
const readJSON = async p => JSON.parse(await readStr(p))

export const template = opt => {
    return {
        name: 'template',
        generateBundle: async () => {
            await new Promise(r => setTimeout(r))

            const manifest = await readJSON(opt.manifest)
            const replace = s => {
                return Object.keys(manifest.entry).reduce((acc, key) => {
                    const val = manifest.entry[key]
                    const r = acc.replace(new RegExp(`__${key}__`, 'g'), val)
                    return r
                }, s)
            }

            const jobs = Object.entries(opt.files).map(async pair => {
                const [src, dst] = pair

                const file = await readStr(src)
                const content = replace(file)

                await mkdir(path.dirname(dst), { recursive: true })
                await writeFile(dst, content)
            })
            await jobs
        },
    }
}
