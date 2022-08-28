export class Deferred<T = unknown> {
	promise: Promise<T>
	// @ts-ignore
	resolve: (payload: T) => void
	// @ts-ignore
	reject: (err: Error) => void
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}
}

export function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms))
}
