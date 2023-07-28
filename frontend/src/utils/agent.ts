const auth = async (r: Response) => {
	if (r.ok) {
		const body = await r.json()
		return body
	} else {
		const msg = await r.text()
		throw new Error(msg)
	}
}

type data = Record<string, unknown>

const req = async (method: string, url: string, data: null | data) => {
	return fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
		body: data && JSON.stringify(data),
		redirect: "follow",
		mode: "same-origin",
		credentials: "same-origin",
	}).then(auth)
}

export const get = (url: string) => req("GET", url, null)
export const post = (url: string, data: data) => req("POST", url, data)
export const put = (url: string, data: data) => req("PUT", url, data)
export const del = (url: string, data: data) => req("DELETE", url, data)
