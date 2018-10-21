// import { getConnection } from "typeorm";

export const info = {
    async handler(_request, _h) {
        // const conn = getConnection();
        return { name: "x" };
    },
};

export const logout = {
    async handler(_request, _h) {
        return { name: "404" };
    },
};

export const connectGithub = {
    auth: "github",
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            const credentials = request.auth;
            const profile = credentials.profile;
            console.log(profile);
            return h.redirect("/api/v1/user");
        } else {
            const errMsg = request.auth.error.message;
            return `Authentication failed due to: ${errMsg}`;
        }
    },
};
