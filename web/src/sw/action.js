const dispatch = async (actions, cache, req, resp, worker) => {
    if (!resp.ok) return
    actions.split('|').forEach(action => {
        const [fn, ...args] = action.split(';')
        switch (fn) {
            case 'update':
                return cache.put(args[0], resp.clone())
            case 'sync':
                worker.sync = args[0] === 'true'
                worker.clients.matchAll().then(cs => {
                    cs.forEach(c =>
                        c.postMessage({ kind: 'sync', sync: worker.sync }),
                    )
                })
                return
            default:
                console.error(`unknown action: ${action}`)
        }
    })
}

export default dispatch
