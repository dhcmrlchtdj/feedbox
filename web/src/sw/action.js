const dispatch = async (action, cache, req, resp) => {
    if (!resp.ok) return;
    const [fn, ...args] = action.split(";");
    switch (fn) {
        case "update":
            return cache.put(args[0], resp.clone());
        default:
            console.error(`unknown action: ${action}`);
    }
};

export default dispatch;
