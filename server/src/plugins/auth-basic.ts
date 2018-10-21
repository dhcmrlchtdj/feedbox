import * as authBasic from "hapi-auth-basic";

const validate = async (request, username, password, h) => {
    if (
        username === process.env.CRON_USERNAME &&
        password === process.env.CRON_PASSWORD
    ) {
        return { isValid: true, credentials: { username } };
    } else {
        return h.response().code(401);
    }
};

export default async server => {
    await server.register(authBasic);
    server.auth.strategy("cron", "basic", { validate });
};
