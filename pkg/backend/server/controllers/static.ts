const icon = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmklEQVR4AcWWgUeDQRjGD6iogFgCooCiP6ZWf0QIomq7NygmAFWr/pigJSEChNik7q5Ai7bwdK/vSF8tt6/b3cOP+Yz3vXvvnnuEr/BC4zDVFWh5Ak1XFm3pOjR/g6I6DC3DrI+JUIKhWVv0zPJmgR/8XzqF3p4pXri1NgJF+9Dyw4JiUBeGarinYdGPuHNoeWtBIBowm5OexSsL2UwlAtOConmPlYcunmtCU0n8Jp4TNN0MsLiDrvl8ibzcgUMUlNz5edXcaY/E67dRuHuOqBg6+HI4ZzJxoTbYMZ29Ig3VsmBvT9aAkscie1gkEtHgHTAJG1ACSnbSNUDv6RtIPoL0h1BRPd01pCPBGS6hES3yCEYt7RRWzLUFiwNkgu2v55NQN6IFd6BoOp8JahF3YK9HJJONCLO/wN3qUI9QSiVLc4ANPOB5a0r8JY7OnF7DF6cmnipzwkd43JiAludBt91lQG/xnDi9/scjsoeOdt3Mi4k75wDZXyPU5rTjrloQOcesltm/YeiSXzJeIcO/+RuMPISmJedwXvoEIKUq7CctWTEAAAAASUVORK5CYII',
    'base64',
)

const genNoCache = (filename: string, forcePath?: string) => {
    const path = forcePath ?? `/${filename}`
    return {
        path,
        method: 'get',
        options: {
            auth: false,
            // no-cache: caches must check with the origin server for validation before using the cached copy
            // cache: { expiresIn: 0 },
            async handler(_request, h) {
                return h.file(filename)
            },
        },
    }
}

export const staticFiles = [
    {
        path: '/robots.txt',
        method: 'get',
        options: {
            auth: false,
            // max-age=86400, must-revalidate
            cache: { expiresIn: 24 * 60 * 60 * 1000 },
            async handler(_request, h) {
                return h
                    .response('User-agent: *')
                    .etag('7e49dfd97319f5dd7cdaea8518cf43e0e8d01e5a-sha1')
            },
        },
    },

    genNoCache('index.html', '/'),
    genNoCache('index.html'),
    genNoCache('sw.js'),
    genNoCache('sw.js.map'),

    {
        path: '/favicon.ico',
        method: 'get',
        options: {
            auth: false,
            // max-age=86400, must-revalidate
            cache: { expiresIn: 24 * 60 * 60 * 1000 },
            async handler(_request, h) {
                return h
                    .response(icon)
                    .type('image/png')
                    .etag('d2fa1ebb82da39f122f114f8bda9018ffacf80d7-sha1')
            },
        },
    },

    {
        path: '/{filename}',
        method: 'get',
        options: {
            auth: false,
            // max-age=31536000, must-revalidate
            cache: { expiresIn: 365 * 24 * 60 * 60 * 1000 },
            handler: { directory: { path: '.', index: false } },
        },
    },
]
