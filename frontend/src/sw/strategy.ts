type strategy = (cache: Cache, req: Request | string) => Promise<Response>

export const cacheOnly: strategy = async (cache, req) => {
	const cached = await cache.match(req)
	if (cached) return cached
	return new Response("Cache Not Found", {
		status: 404,
		statusText: "Not Found",
	})
}

export const cacheFirst: strategy = async (cache, req) => {
	const cached = await cache.match(req)
	if (cached) {
		// @ts-expect-error
		if (process.env.NODE_ENV !== "production") {
			fetchResource(req, cache)
		}
		return cached
	} else {
		return fetchResource(req, cache)
	}
}

export const networkOnly: strategy = async (_cache, req) => {
	return fetch(req)
}

export const networkFirst: strategy = async (cache, req) => {
	const fetched = fetchResource(req, cache)
	const resp = fetched.catch(async (err) => {
		const cached = await cache.match(req)
		if (cached) return cached
		throw err
	})
	return resp
}

function fetchResource(req: Request | string, cache: Cache): Promise<Response> {
	return fetch(req).then((resp) => {
		if (resp.ok) {
			cache.put(req, resp.clone())
		} else {
			cache.delete(req)
		}
		return resp
	})
}
