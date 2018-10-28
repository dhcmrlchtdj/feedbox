import * as jwt from "jsonwebtoken";
import User from "../models/user";

export const info = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials;
        const user = await User.takeByIdWithFeeds(userId);
        return user;
    },
};

const stateTokenOpt = {
    path: "/",
    isSecure: process.env.NODE_ENV === "production",
    isHttpOnly: true,
    isSameSite: false,
    ttl: 7 * 24 * 60 * 60 * 1000,
    encoding: "none",
    clearInvalid: true,
};

export const logout = {
    auth: false,
    async handler(_request, h) {
        h.unstate("token", stateTokenOpt);
        return "done | logout";
    },
};

export const login = {
    async handler(_request, h) {
        return h.redirect(process.env.LOGIN_REDIRECT);
    },
};

export const connectGithub = {
    auth: "github",
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            // get user info
            const { id, email } = request.auth.credentials.profile;
            // TODO: empty email
            const user = await User.takeOrCreateByGithub(id, email);

            // set cookie
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET as string,
                {
                    expiresIn: "7d",
                },
            );
            h.state("token", token, stateTokenOpt);

            // redirect to user info
            return h.redirect("/login");
        } else {
            const errMsg = request.auth.error.message;
            return `Authentication failed due to: ${errMsg}`;
        }
    },
};
