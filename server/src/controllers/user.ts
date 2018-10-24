import * as jwt from "jsonwebtoken";
import User from "../models/user";

export const info = {
    async handler(request, h) {
        const { userId } = request.auth.credentials;
        const user = await User.takeOneById(userId);
        return h.response(user);
    },
};

const stateTokenOpt = {
    path: "/",
    isSecure: process.env.NODE_ENV === "production",
    ttl: 7 * 24 * 60 * 60 * 1000,
    clearInvalid: true,
    encoding: "none",
};

export const logout = {
    auth: false,
    async handler(_request, h) {
        h.unstate("token", stateTokenOpt);
        return h.response("done | logout");
    },
};

export const connectGithub = {
    auth: "github",
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            if (typeof process.env.JWT_SECRET !== "string") {
                throw new Error("env | JWT_SECRET is required");
            }

            // get user info
            const { id, email } = request.auth.credentials.profile;
            const user = await User.takeOrCreateByGithub(id, email);

            // set cookie
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            h.state("token", token, stateTokenOpt);

            // redirect to user info
            return h.redirect("/api/v1/user");
        } else {
            const errMsg = request.auth.error.message;
            return `Authentication failed due to: ${errMsg}`;
        }
    },
};
