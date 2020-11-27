const fs = require('fs').promises
const path = require('path')

exports.template = template

async function template(input, output, pattern) {
    const replace = (tmpl) => {
        return pattern.reduce((content, [fromPattern, toPattern]) => {
            return content.replace(fromPattern, toPattern)
        }, tmpl)
    }

    const tmpl = await fs.readFile(input, 'utf8')
    const content = replace(tmpl)
    await fs.mkdir(path.dirname(output), { recursive: true })
    await fs.writeFile(output, content)

    const f = path.relative(process.cwd(), input)
    const t = path.relative(process.cwd(), output)
    console.log(`${f} => ${t}`)
}
