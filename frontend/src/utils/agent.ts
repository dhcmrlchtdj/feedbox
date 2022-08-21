const auth = async (r: Response) => {
    if (r.ok) {
        const body = await r.json()
        return body
    } else {
        const msg = await r.text()
        throw new Error(msg)
    }
}

type headers = Record<string, string>
type data = Record<string, unknown>

const req = async (
    method: string,
    url: string,
    data: null | data,
    headers: headers = {},
) => {
    if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json; charset=utf-8"
    }
    return fetch(url, {
        method,
        headers,
        body: data && JSON.stringify(data),
        redirect: "follow",
        mode: "same-origin",
        credentials: "same-origin",
    }).then(auth)
}

export const get = async (url: string, headers: headers) =>
    req("GET", url, null, headers)
export const post = async (url: string, data: data, headers: headers) =>
    req("POST", url, data, headers)
export const put = async (url: string, data: data, headers: headers) =>
    req("PUT", url, data, headers)
export const del = async (url: string, data: data, headers: headers) =>
    req("DELETE", url, data, headers)
