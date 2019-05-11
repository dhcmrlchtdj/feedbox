export default (dateStr, fmt = 'YYYY-MM-DD hh:mm:ss') => {
    if (!dateStr) return 'unknown'

    const pad = value => `0${value}`.slice(-2)
    const date = new Date(dateStr)
    const _year = date.getFullYear()
    const _month = date.getMonth() + 1
    const _date = date.getDate()
    const _hour = date.getHours()
    const _minute = date.getMinutes()
    const _second = date.getSeconds()
    const _ms = date.getMilliseconds()
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
