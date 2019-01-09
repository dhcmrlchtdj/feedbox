import logger from "./logger";
import authBasic from "./auth-basic";
import authSession from "./auth-session";
import OAuth from "./oauth";

const register = async (server): Promise<void> => {
    await server.register(logger);

    await authBasic(server);
    await authSession(server);
    server.auth.default("session");

    await OAuth(server);
};

export default register;
