// const router = new Router();
// router.route("get", "/", () => {});
// const fn = router.match("get", "/");

class Router {
    constructor() {
        this._routes = {};
        this._fallback = null;
    }

    fallback(fn) {
        this._fallback = fn;
        return this;
    }

    add(method, url, fn) {
        if (!this._routes[method]) this._routes[method] = {};
        const routes = this._routes[method];
        routes[url] = fn;
        return this;
    }

    match(method, url) {
        if (!this._routes[method]) this._routes[method] = {};
        const routes = this._routes[method];
        return routes[url] || this._fallback;
    }
}

export default Router;
