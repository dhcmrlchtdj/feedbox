export function dataGuarder<T extends unknown[]>(fn: (...args: T) => void) {
	let latestVersion = 0
	return () => {
		const currentVersion = latestVersion
		return (...args: Parameters<typeof fn>) => {
			if (currentVersion !== latestVersion) return
			latestVersion++
			fn(...args)
		}
	}
}
