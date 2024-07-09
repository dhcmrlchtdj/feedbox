type strategy = (cache: Cache, req: Request | string) => Promise<Response>

export const cacheOnly: strategy = async (cache, req) => {
	const cached = await cache.match(req)
	if (cached) return cached
	return new Response("Cache Not Found", { status: 404 })
}

export const cacheFirst: strategy = async (cache, req) => {
	const cached = await cache.match(req)
	if (cached) {
		return cached
	} else {
		return fetchResource(req, cache)
	}
}

export const networkOnly: strategy = (_cache, req) => {
	return fetch(req)
}

export const networkFirst: strategy = (cache, req) => {
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
