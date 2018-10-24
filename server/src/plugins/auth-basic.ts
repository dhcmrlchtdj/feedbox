import * as authBasic from "hapi-auth-basic";

const validate = async (_request, username: string, password: string, h) => {
    if (
        username === process.env.CRON_USERNAME &&
        password === process.env.CRON_PASSWORD
    ) {
        return { isValid: true, credentials: { username } };
    } else {
        return h.response().code(401);
    }
};

export default async (server): Promise<void> => {
    await server.register(authBasic);
    server.auth.strategy("cron", "basic", { validate });
};
