export const genClass = (
	base: string,
	...cond: [boolean | null | undefined, string][]
): string => {
	return [base, ...cond.map(([c, v]) => (c ? v : ""))].join(" ")
}

///

const pad = (value: number) => String(value).padStart(2, "0")
export const formatDate = (date: Date, fmt: string = "YYYY-MM-DD hh:mm:ss") => {
	const _year = date.getFullYear()
	const _month = date.getMonth() + 1
	const _date = date.getDate()
	const _hour = date.getHours()
	const _minute = date.getMinutes()
	const _second = date.getSeconds()
	const pairs: Record<string, unknown> = {
		YYYY: _year,
		M: _month,
		MM: pad(_month),
		D: _date,
		DD: pad(_date),
		h: _hour,
		hh: pad(_hour),
		m: _minute,
		mm: pad(_minute),
		s: _second,
		ss: pad(_second),
	}

	return fmt.replaceAll(
		/YYYY|MM?|DD?|hh?|mm?|ss?/g,
		(matched) => pairs[matched] as string,
	)
}

///

export class VersionConflict extends Error {}
export function versionGuarder<T extends unknown[]>(
	fn: (...args: T) => unknown,
) {
	let latestVersion = 0
	let nextVersion = 1
	return () => {
		const currentVersion = nextVersion
		nextVersion += 1
		return (...args: Parameters<typeof fn>) => {
			if (currentVersion <= latestVersion) throw new VersionConflict()
			latestVersion = currentVersion
			fn(...args)
		}
	}
}

///

export function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms))
}

///

// https://github.com/Rich-Harris/devalue#xss-mitigation
export function sanitize(data: string): string {
	const unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g
	const escaped: Record<string, string> = {
		"<": "\\u003C",
		">": "\\u003E",
		"/": "\\u002F",
		"\\": "\\\\",
		"\b": "\\b",
		"\f": "\\f",
		"\n": "\\n",
		"\r": "\\r",
		"\t": "\\t",
		"\0": "\\u0000",
		"\u2028": "\\u2028",
		"\u2029": "\\u2029",
	}
	return data.replaceAll(unsafeChars, (c) => escaped[c]!)
}
