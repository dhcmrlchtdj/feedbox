const auth = async <T>(r: Response) => {
	if (r.ok) {
		const body = (await r.json()) as T
		return body
	} else {
		const msg = await r.text()
		throw new Error(msg)
	}
}

type data = Record<string, unknown>

const req = <T>(method: string, url: string, data: null | data) => {
	return fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
		body: data && JSON.stringify(data),
		redirect: "follow",
		mode: "same-origin",
		credentials: "same-origin",
	}).then(auth<T>)
}

export const get = <T>(url: string) => req<T>("GET", url, null)
export const post = <T>(url: string, data: data) => req<T>("POST", url, data)
export const put = <T>(url: string, data: data) => req<T>("PUT", url, data)
export const del = <T>(url: string, data: data) => req<T>("DELETE", url, data)
