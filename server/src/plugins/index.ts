import * as pino from "hapi-pino";
import * as bell from "bell";
import authJWT from "./auth-jwt";
import authGithub from "./auth-github";

const register = async server => {
    // log
    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== "production",
        },
    });

    // auth
    await authJWT(server);
    // server.auth.default('jwt');

    // oauth github
    await server.register(bell);
    await authGithub(server);
};

export default register;
