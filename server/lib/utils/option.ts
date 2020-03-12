export interface Option<T> {
    isNone: boolean
    isSome: boolean
    getExn(): T
    map<K>(f: (x: T) => K): Option<K>
    bind<K>(f: (x: T) => Option<K>): Option<K>
}

export const None: Option<any> = {
    isNone: true,
    isSome: false,
    getExn: () => {
        throw new Error('Option.getExn')
    },
    map: _ => None,
    bind: _ => None,
}

export const Some = <T>(x: T): Option<T> => ({
    isNone: false,
    isSome: true,
    getExn: () => x,
    map: f => Some(f(x)),
    bind: f => f(x),
})
