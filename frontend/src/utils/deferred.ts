export function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms))
}

export class Deferred<T = void> {
	promise: Promise<T>
	resolve!: (payload: T | PromiseLike<T>) => void
	reject!: (err?: unknown) => void

	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}
}
