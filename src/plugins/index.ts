import logger from "./logger";
import authBasic from "./auth-basic";
import authJWT from "./auth-jwt";
import OAuth from "./oauth";

const register = async (server): Promise<void> => {
    await server.register(logger);

    await authBasic(server);
    await authJWT(server);
    server.auth.default("jwt");

    await OAuth(server);
};

export default register;
