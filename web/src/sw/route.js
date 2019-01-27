import { router, defaultHandler } from "./router";

const route = (method, url) => {
    const handlerOpt = router.route(method, url);
    const handler = handlerOpt.isSome ? handlerOpt.getExn()[0] : defaultHandler;
    return handler;
};

export default route;
