import App from "../components/app.svelte.js"
import type { Feed, User } from "../state.js"
import { dataGuarder } from "../utils/data-guarder.js"
import { Router } from "../utils/router.js"
import { sanitize } from "../utils/sanitize.js"
import * as strategy from "./strategy.js"
import * as version from "./version.js"

const just =
	(
		cacheName: string,
		strategyName:
			| "cacheOnly"
			| "cacheFirst"
			| "networkOnly"
			| "networkFirst",
	) =>
	async ({ event }: { event: FetchEvent }) => {
		console.log(
			`[SW] | just | ${cacheName} | ${strategyName} | ${event.request.url}`,
		)
		const cache = await caches.open(cacheName)
		const resp = await strategy[strategyName](cache, event.request)
		return resp
	}

const createFeedsSetter = dataGuarder((cache: Cache, r: Response) =>
	cache.put("/api/v1/feeds", r),
)
const getThenUpdate = async ({ event }: { event: FetchEvent }) => {
	console.log(
		`[SW] | getThenUpdate | ${version.API} | networkOnly | ${event.request.url}`,
	)
	const setFeeds = createFeedsSetter()
	const cache = await caches.open(version.API)
	const resp = await strategy.networkOnly(cache, event.request)
	if (resp.ok) setFeeds(cache, resp.clone())
	return resp
}

type RouterContext = {
	params: Map<string, string>
	event: FetchEvent
}
export const router = new Router<RouterContext>()
	.fallback(just(version.API, "networkOnly"))
	// homepage
	.get("/", async ({ event }) => {
		const apiCache = await caches.open(version.API)
		const staticCache = await caches.open(version.STATIC)

		const resp = await strategy.cacheFirst(staticCache, event.request)
		return Promise.all([
			strategy.cacheOnly(apiCache, "/api/v1/user"),
			strategy.cacheOnly(apiCache, "/api/v1/feeds"),
		])
			.then(async ([user, feeds]) => {
				if (user && user.ok && feeds && feeds.ok) {
					return Promise.all([
						user.json() as Promise<User>,
						feeds.json() as Promise<Feed[]>,
					])
				} else {
					throw new Error("cache missing")
				}
			})
			.then(async ([user, feeds]) => {
				const state = {
					loaded: { promise: true },
					email: user.addition.email,
					feeds: feeds,
				}
				const tpl = await resp.clone().text()
				// @ts-expect-error
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				const app = App.render(state) as { html: string }
				const inlinedState = `window.__STATE__=${sanitize(
					JSON.stringify(state),
				)}`
				const scriptNonce = crypto.randomUUID().slice(0, 8)
				const html = tpl.replace(
					'<div id="app"></div>',
					`<div id="app">${app.html}</div><script nonce="${scriptNonce}">${inlinedState}</script>`,
				)

				const headers = new Headers(resp.headers)
				const csp = headers.get("content-security-policy") ?? ""
				const patchedCSP = csp.replace(
					"script-src 'self';",
					`script-src 'self' 'unsafe-inline' 'nonce-${scriptNonce}';`,
				)
				headers.set("content-security-policy", patchedCSP)

				return new Response(html, { status: 200, headers })
			})
			.catch((err: Error) => {
				console.error(err.stack)
				return resp
			})
	})
	// API
	.get("/api/v1/feeds", just(version.API, "networkFirst"))
	.get("/api/v1/user", just(version.API, "networkFirst"))
	.put("/api/v1/feeds/add", getThenUpdate)
	.delete("/api/v1/feeds/remove", getThenUpdate)
	// static
	.get("/sw.js", just(version.STATIC, "networkOnly"))
	.get("/:file", ({ event, params }) => {
		const file = params.get("file")!
		if (
			file.endsWith(".js") ||
			file.endsWith(".css") ||
			file.endsWith(".map") ||
			file.endsWith(".webmanifest") ||
			file.endsWith(".ico")
		) {
			return just(version.STATIC, "cacheFirst")({ event })
		} else {
			return just(version.STATIC, "networkOnly")({ event })
		}
	})
