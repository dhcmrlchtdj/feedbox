export interface Result<T, E> {
    isOk: boolean
    isErr: boolean
    getExn(): T
    getErrExn(): E
    map<K>(f: (x: T) => K): Result<K, E>
    bind<K>(f: (x: T) => Result<K, E>): Result<K, E>
    mapErr<R>(f: (x: E) => R): Result<T, R>
    bindErr<R>(f: (x: E) => Result<T, R>): Result<T, R>
}

class OkC<T, E> implements Result<T, E> {
    private x: T
    isOk = true
    isErr = false
    constructor(x: T) {
        this.x = x
    }
    getExn() {
        return this.x
    }
    getErrExn(): E {
        throw new Error('Result.getErrExn')
    }
    map<K>(f: (x: T) => K): Result<K, E> {
        return new OkC<K, E>(f(this.x))
    }
    bind<K>(f: (x: T) => Result<K, E>): Result<K, E> {
        return f(this.x)
    }
    mapErr<R>(_: (e: E) => R): Result<T, R> {
        return new OkC(this.x)
    }
    bindErr<R>(_: (e: E) => Result<T, R>): Result<T, R> {
        return new OkC(this.x)
    }
}
export const Ok = <T, E>(x: T): Result<T, E> => new OkC<T, E>(x)

class ErrC<T, E> implements Result<T, E> {
    private err: E
    isOk = false
    isErr = true
    constructor(err: E) {
        this.err = err
    }
    getExn(): T {
        throw new Error('Result.getExn')
    }
    getErrExn(): E {
        return this.err
    }
    map<K>(_: (x: T) => K): Result<K, E> {
        return new ErrC(this.err)
    }
    bind<K>(_: (x: T) => Result<K, E>): Result<K, E> {
        return new ErrC(this.err)
    }
    mapErr<R>(f: (e: E) => R): Result<T, R> {
        return new ErrC(f(this.err))
    }
    bindErr<R>(f: (e: E) => Result<T, R>): Result<T, R> {
        return f(this.err)
    }
}
export const Err = <T, E>(err: E): Result<T, E> => new ErrC<T, E>(err)
