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
	return data.replace(unsafeChars, (c) => escaped[c]!)
}
