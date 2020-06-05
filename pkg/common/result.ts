export const Ok = <T, E>(x: T): Result<T, E> => new OkC<T, E>(x)

export const Err = <T, E>(err: E): Result<T, E> => new ErrC<T, E>(err)

export abstract class Result<T, E> {
    abstract isOk: boolean
    abstract isErr: boolean
    constructor() {}
    getExn(): T {
        throw new Error('Result.getExn')
    }
    getErrExn(): E {
        throw new Error('Result.getErrExn')
    }
    map<K>(_: (x: T) => K): Result<K, E> {
        return this as any
    }
    bind<K>(_: (x: T) => Result<K, E>): Result<K, E> {
        return this as any
    }
    mapErr<R>(_: (x: E) => R): Result<T, R> {
        return this as any
    }
    bindErr<R>(_: (x: E) => Result<T, R>): Result<T, R> {
        return this as any
    }

    static try<X, Y>(f: () => Result<X, Y>): Result<X, Y>
    static try<X, Y = unknown>(f: () => X): Result<X, Y> {
        try {
            const r = f()
            if (r instanceof Result) {
                return r
            } else {
                return Ok(r)
            }
        } catch (err) {
            return Err(err)
        }
    }
}

class OkC<T, E> extends Result<T, E> {
    private x: T
    isOk = true
    isErr = false
    constructor(x: T) {
        super()
        this.x = x
    }
    getExn() {
        return this.x
    }
    map<K>(f: (x: T) => K): Result<K, E> {
        return new OkC<K, E>(f(this.x))
    }
    bind<K>(f: (x: T) => Result<K, E>): Result<K, E> {
        return f(this.x)
    }
}

class ErrC<T, E> extends Result<T, E> {
    private err: E
    isOk = false
    isErr = true
    constructor(err: E) {
        super()
        this.err = err
    }
    getErrExn(): E {
        return this.err
    }
    mapErr<R>(f: (e: E) => R): Result<T, R> {
        return new ErrC(f(this.err))
    }
    bindErr<R>(f: (e: E) => Result<T, R>): Result<T, R> {
        return f(this.err)
    }
}
