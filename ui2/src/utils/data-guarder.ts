export function dataGuarder<T extends unknown[]>(fn: (...args: T) => unknown) {
	let latestVersion = 0
	let nextVersion = 1
	return () => {
		const currentVersion = nextVersion
		nextVersion += 1
		return (...args: Parameters<typeof fn>) => {
			if (currentVersion <= latestVersion) return
			latestVersion = currentVersion
			fn(...args)
		}
	}
}
