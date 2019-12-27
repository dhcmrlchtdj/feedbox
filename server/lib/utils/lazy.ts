const lazy = <T>(thunk: () => T): (() => T) => {
    let m: T | null = null
    return () => {
        if (m === null) m = thunk()
        return m
    }
}

export default lazy
