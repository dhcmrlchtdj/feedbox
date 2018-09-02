import * as pino from "hapi-pino";

const register = async server => {
    // log
    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== "production",
        },
    });
};

export default register;
