const fs = require('fs')
const path = require('path')
const Cloudworker = require('@dollarshaveclub/cloudworker')

const scriptPath = path.resolve(__dirname, '../bundle/index.js')
const script = fs.readFileSync(scriptPath).toString()

test('rewrite host', async () => {
    const cw = new Cloudworker(script)
    const req = new Cloudworker.Request('http://feedbox.h11.io/api/v1/user')
    const resp = await cw.dispatch(req)
    expect(resp.url).toEqual('http://localhost:8000/api/v1/user')
})
