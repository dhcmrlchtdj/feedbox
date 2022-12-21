interface Layer {
	get(): string | null
	set(value: string): boolean
}

export class Composed implements Layer {
	private layers: Layer[]
	constructor(...layers: Layer[]) {
		this.layers = layers
	}
	get(): string | null {
		for (const layer of this.layers) {
			const r = layer.get()
			if (r !== null) return r
		}
		return null
	}
	set(value: string): boolean {
		for (const layer of this.layers) {
			const r = layer.set(value)
			if (r) return true
		}
		return false
	}
}

export class QueryLayer implements Layer {
	private key: string
	private query: URLSearchParams | undefined
	constructor(key: string, query?: URLSearchParams) {
		this.key = key
		this.query = query
	}
	get(): string | null {
		const query = this.query ?? new URLSearchParams(location.search)
		return query.get(this.key)
	}
	set(_value: string): boolean {
		return false
	}
}

export class SessionStorageLayer implements Layer {
	private key: string
	constructor(key: string) {
		this.key = key
	}
	get(): string | null {
		try {
			const val = sessionStorage.getItem(this.key)
			return val
		} catch (err) {
			console.error(err)
			return null
		}
	}
	set(value: string): boolean {
		try {
			sessionStorage.setItem(this.key, value)
			return true
		} catch (err) {
			console.error(err)
			return false
		}
	}
}
