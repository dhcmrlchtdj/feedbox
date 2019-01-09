import User from "../models/user";

export const info = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials;
        const user = await User.takeById(userId);
        return user;
    },
};

export const logout = {
    auth: false,
    async handler(request, _h) {
        request.cookieAuth.clear();
        return "done | logout";
    },
};

export const login = {
    async handler(_request, h) {
        return h.redirect(process.env.SITE);
    },
};

export const connectGithub = {
    auth: "github",
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            // get user info
            const { id, email } = request.auth.credentials.profile;
            const user = await User.takeOrCreateByGithub(id, email); // FIXME: empty email

            // set cookie
            request.cookieAuth.set({ id: user.id });

            // redirect to user info
            return h.redirect("/api/login");
        } else {
            const errMsg = request.auth.error.message;
            return `Authentication failed due to: ${errMsg}`;
        }
    },
};
