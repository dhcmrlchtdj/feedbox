// import { getConnection } from "typeorm";

export const info = {
    auth: "sessions",
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            const credentials = request.auth.credentials;
            const sid = credentials.sid;
            const x = await request.server.app.cache.get(sid);
            return x;
        }
    },
};

export const logout = {
    async handler(request, h) {
        console.log(request.state);
        const sid = request.state.sid.sid;
        request.server.app.cache.drop(sid);
        request.cookieAuth.clear();
        return h.response("done");
    },
};

export const connectGithub = {
    auth: "github",
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            const credentials = request.auth.credentials;
            const profile = credentials.profile;

            const sid = "1";
            await request.server.app.cache.set(sid, { profile }, 0);
            request.cookieAuth.set({ sid });

            return h.redirect("/api/v1/user");
        } else {
            const errMsg = request.auth.error.message;
            return `Authentication failed due to: ${errMsg}`;
        }
    },
};
