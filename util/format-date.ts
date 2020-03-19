const pad = (value: number) => `0${value}`.slice(-2)

export const format = (
    date: Date | number,
    fmt: string = 'YYYY-MM-DD hh:mm:ss',
) => {
    const d = new Date(date)
    const _year = d.getFullYear()
    const _month = d.getMonth() + 1
    const _date = d.getDate()
    const _hour = d.getHours()
    const _minute = d.getMinutes()
    const _second = d.getSeconds()
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

    return fmt.replace(/YYYY|MM?|DD?|hh?|mm?|ss?/g, matched => pairs[matched])
}
