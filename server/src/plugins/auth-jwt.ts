import * as authJWT from "hapi-auth-jwt2";
import User from "../models/user";

const validate = async (decoded, request, h) => {
    const user = await User.takeOne({ where: { id: decoded.id } });
    if (user) {
        return { isValid: true, credentials: user };
    } else {
        return h.response().code(401);
    }
};

const auth = async server => {
    await server.register(authJWT);
    server.auth.strategy("jwt", "jwt", {
        key: process.env.JWT_SECRET,
        urlKey: false,
        validate,
    });
};

export default auth;
