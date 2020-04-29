const empty = Symbol()

export const lazy = <T>(thunk: () => T): (() => T) => {
    let m: T | typeof empty = empty
    return () => {
        if (m === empty) m = thunk()
        return m
    }
}
