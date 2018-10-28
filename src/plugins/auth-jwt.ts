import * as authJWT from "hapi-auth-jwt2";
import User from "../models/user";

const validate = async (decoded, _request, h) => {
    const user = await User.takeOne({
        select: ["id"],
        where: { id: decoded.id },
    });
    if (user) {
        return { isValid: true, credentials: { userId: user.id } };
    } else {
        return h.response().code(401);
    }
};

export default async (server): Promise<void> => {
    await server.register(authJWT);
    server.auth.strategy("jwt", "jwt", {
        key: process.env.JWT_SECRET,
        urlKey: false,
        validate,
    });
};
