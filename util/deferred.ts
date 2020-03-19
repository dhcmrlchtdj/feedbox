export class Deferred<T = void> {
    promise: Promise<T>
    // @ts-ignore
    resolve: (payload: T) => void
    // @ts-ignore
    reject: (err: Error) => void
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}
