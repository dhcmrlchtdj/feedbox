const pad = (value: number) => String(value).padStart(2, "0")

export const format = (date: Date, fmt: string = "YYYY-MM-DD hh:mm:ss") => {
	const _year = date.getFullYear()
	const _month = date.getMonth() + 1
	const _date = date.getDate()
	const _hour = date.getHours()
	const _minute = date.getMinutes()
	const _second = date.getSeconds()
	const pairs = {
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

	// @ts-ignore
	return fmt.replace(/YYYY|MM?|DD?|hh?|mm?|ss?/g, (matched) => pairs[matched])
}
