import * as pino from "hapi-pino";
import authBasic from "./auth-basic";
import authJWT from "./auth-jwt";
import OAuth from "./oauth";

const register = async server => {
    // log
    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== "production",
        },
    });

    // auth
    await authBasic(server);
    await authJWT(server);
    server.auth.default("jwt");

    // oauth
    await OAuth(server);
};

export default register;
