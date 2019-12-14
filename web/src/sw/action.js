const dispatch = async (actions, cache, req, resp, worker) => {
    if (!resp.ok) return
    actions.split('|').forEach(action => {
        const [fn, ...args] = action.split(';')
        switch (fn) {
            case 'update':
                return cache.put(args[0], resp.clone())
            default:
                console.error(`unknown action: ${action}`)
        }
    })
}

export default dispatch
