// @ts-ignore
import App from "../components/app.html"
import { WorkerRouter } from "./worker_router"
import * as strategy from "./strategy"
import * as version from "./version"
import { sanitize } from "../utils/sanitize"

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

const getThenUpdate = async ({ event }: { event: FetchEvent }) => {
	console.log(
		`[SW] | getThenUpdate | ${version.API} | networkOnly | ${event.request.url}`,
	)
	const cache = await caches.open(version.API)
	const resp = await strategy.networkOnly(cache, event.request)
	if (resp.ok) cache.put("/api/v1/feeds", resp.clone())
	return resp
}

type RouterContext = {
	params: Map<string, string>
	event: FetchEvent
}
export const router = new WorkerRouter<RouterContext>()
	.fallback(just(version.API, "networkOnly"))
	// homepage
	.get("/", async ({ event }) => {
		const apiCache = await caches.open(version.API)
		const staticCache = await caches.open(version.STATIC)

		const resp = await strategy.cacheFirst(staticCache, event.request)
		return Promise.all([
			strategy.cacheOnly(apiCache, `/api/v1/user`),
			strategy.cacheOnly(apiCache, `/api/v1/feeds`),
		])
			.then(async ([user, feeds]) => {
				if (user && user.ok && feeds && feeds.ok) {
					return Promise.all([user.json(), feeds.json()])
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
				const app = App.render(state)
				const inlinedState = `window.__STATE__=${sanitize(
					JSON.stringify(state),
				)}`
				const scriptNonce = crypto.randomUUID().slice(0, 8)
				const html = tpl.replace(
					'<div id="app"></div>',
					`<div id="app">${app.html}</div>
                    <script nonce="${scriptNonce}">${inlinedState}</script>`,
				)

				const headers = new Headers(resp.headers)
				const csp = headers.get("content-security-policy") ?? ""
				const patchedCSP = csp.replace(
					"script-src 'self';",
					`script-src 'self' 'unsafe-inline' 'nonce-${scriptNonce}';`,
				)
				headers.set("content-security-policy", patchedCSP)

				return new Response(html, {
					status: resp.status,
					statusText: resp.statusText,
					headers,
				})
			})
			.catch((err) => {
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
	.get("/favicon.ico", just(version.STATIC, "cacheFirst"))
	.get("/npm/*", just(version.STATIC, "cacheFirst"))
	.get("/:file", ({ event, params }) => {
		const file = params.get("file")!
		if (
			file.endsWith(".js") ||
			file.endsWith(".css") ||
			file.endsWith(".map") ||
			file.endsWith(".ico")
		) {
			return just(version.STATIC, "cacheFirst")({ event })
		} else {
			return just(version.STATIC, "networkOnly")({ event })
		}
	})
