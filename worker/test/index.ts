const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Cloudworker = require('@dollarshaveclub/cloudworker')

const readStr = async (p: string) => (await fs.promises.readFile(p)).toString()
const scriptPath = path.resolve(__dirname, '../bundle/index.js')

const test = async () => {
    const script = await readStr(scriptPath)
    const cw = new Cloudworker(script)
    const req = new Cloudworker.Request('http://feedbox.h11.io/api/v1/user')
    const res = await cw.dispatch(req)

    assert(res.url === 'http://localhost:8000/api/v1/user')
    assert(res.status === 401)
}

test()
