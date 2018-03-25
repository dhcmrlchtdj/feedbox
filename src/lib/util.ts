export async function areduce<T, K>(
    arr: T[],
    reducer: (prev: K, next: T) => Promise<K>,
    initial: K,
) {
    const reducerAsync = async (prev: Promise<K>, next: T): Promise<K> => {
        const p = await prev;
        const n = await reducer(p, next);
        return n;
    };
    const reduced = await arr.reduce(reducerAsync, Promise.resolve(initial));
    return reduced;
}

export async function amap<T, K>(
    arr: T[],
    mapper: (x: T) => Promise<K>,
): Promise<K[]> {
    const reducer = async (prev: Promise<K[]>, curr: T): Promise<K[]> => {
        const coll = await prev;
        const x = await mapper(curr);
        coll.push(x);
        return coll;
    };
    const reduced = await arr.reduce(reducer, Promise.resolve([]));
    return reduced;
}

export async function afilter<T>(
    arr: T[],
    filterer: (x: T) => Promise<boolean>,
): Promise<T[]> {
    const reducer = async (prev: Promise<T[]>, curr: T): Promise<T[]> => {
        const coll = await prev;
        const accept = await filterer(curr);
        if (accept) coll.push(curr);
        return coll;
    };
    const reduced = await arr.reduce(reducer, Promise.resolve([]));
    return reduced;
}
