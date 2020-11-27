const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

exports.hashFiles = hashFiles

function hashFiles(...entries) {
    const files = []

    const next = []
    entries.forEach((entry) => {
        const stat = fs.statSync(entry)
        if (stat.isFile()) {
            files.push(entry)
        } else if (stat.isDirectory()) {
            next.push([entry, fs.readdirSync(entry, { withFileTypes: true })])
        }
    })

    while (next.length > 0) {
        const [parent, curr] = next.pop()
        curr.forEach((f) => {
            const name = f.name
            if (
                name.startsWith('.') ||
                name.startsWith('_') ||
                name.startsWith('node_modules')
            )
                return
            const filepath = path.join(parent, name)
            if (f.isFile()) {
                files.push(filepath)
            } else if (f.isDirectory()) {
                next.push([
                    filepath,
                    fs.readdirSync(filepath, { withFileTypes: true }),
                ])
            }
        })
    }

    const hash = crypto.createHash('sha256')
    files.sort().forEach((file) => {
        const data = fs.readFileSync(file)
        hash.update(data)
    })
    const digest = hash.digest('hex')

    return digest.slice(0, 8)
}
