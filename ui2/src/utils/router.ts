const assert = (c: boolean, msg?: string): void => {
	if (!c) throw new Error(msg)
}

class Node<T> {
	matched: T | null
	static: Map<string, Node<T>>
	parameter: Map<string, Node<T>>
	wildcard: T | null
	constructor() {
		this.matched = null
		this.static = new Map()
		this.parameter = new Map()
		this.wildcard = null
	}
}

class Tree<T> {
	private _root: Node<T>
	constructor() {
		this._root = new Node()
	}
	set(segments: string[], value: T): void {
		let node = this._root
		for (let i = 0, len = segments.length; i < len; i++) {
			const seg = segments[i]!
			if (seg === "*") {
				assert(len === i + 1, '"*" must be the last segment')
				node.wildcard = value
				return
			} else if (seg[0] === ":") {
				const param = seg.slice(1)
				let r = node.parameter.get(param)
				if (r === undefined) {
					r = new Node()
					node.parameter.set(param, r)
				}
				node = r
			} else {
				let r = node.static.get(seg)
				if (r === undefined) {
					r = new Node()
					node.static.set(seg, r)
				}
				node = r
			}
		}
		assert(node.matched === null, "duplicated node")
		node.matched = value
	}
	get(segments: string[]) {
		return this._get(segments, 0, new Map(), this._root)
	}
	private _get(
		segments: string[],
		idx: number,
		params: Map<string, string>,
		node: Node<T>,
	): { matched: T; params: Map<string, string> } | null {
		if (idx === segments.length) {
			if (node.matched !== null) {
				return { matched: node.matched, params }
			}
		} else {
			const seg = segments[idx]!

			const staticNode = node.static.get(seg)
			if (staticNode !== undefined) {
				const found = this._get(segments, idx + 1, params, staticNode)
				if (found !== null) return found
			}

			if (seg !== "") {
				for (const [param, paramNode] of node.parameter) {
					const found = this._get(
						segments,
						idx + 1,
						params,
						paramNode,
					)
					if (found) {
						found.params.set(param, seg)
						return found
					}
				}
			}

			if (node.wildcard !== null) {
				params.set("*", segments.slice(idx).join("/"))
				return { matched: node.wildcard, params }
			}
		}
		return null
	}
}

export type Params = Map<string, string>
type Handler<Context> = (ctx: Context) => Response | Promise<Response>

export class Router<Context> {
	private _router: Tree<Handler<Context>>
	private _fallbackHandler: Handler<Context> | null
	constructor() {
		this._router = new Tree<Handler<Context>>()
		this._fallbackHandler = null
	}

	private add(
		method: string,
		pathname: string,
		handler: Handler<Context>,
	): this {
		const segments = [method.toUpperCase(), ...pathname.split("/")]
		this._router.set(segments, handler)
		return this
	}
	head(pathname: string, handler: Handler<Context>): this {
		return this.add("HEAD", pathname, handler)
	}
	get(pathname: string, handler: Handler<Context>): this {
		return this.add("GET", pathname, handler)
	}
	post(pathname: string, handler: Handler<Context>): this {
		return this.add("POST", pathname, handler)
	}
	put(pathname: string, handler: Handler<Context>): this {
		return this.add("PUT", pathname, handler)
	}
	delete(pathname: string, handler: Handler<Context>): this {
		return this.add("DELETE", pathname, handler)
	}
	fallback(handler: Handler<Context>): this {
		this._fallbackHandler = handler
		return this
	}

	route(request: Request): {
		handler: Handler<Context>
		params: Params
	} | null {
		const url = new URL(request.url)
		const segments = [
			request.method.toUpperCase(),
			...url.pathname.split("/"),
		]
		const found = this._router.get(segments)
		if (found) {
			return { handler: found.matched, params: found.params }
		} else if (this._fallbackHandler) {
			return { handler: this._fallbackHandler, params: new Map() }
		} else {
			return null
		}
	}
}
