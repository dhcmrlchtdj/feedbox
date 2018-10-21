import * as pino from "hapi-pino";
import * as bell from "bell";
import * as authCookie from "hapi-auth-cookie";

const pCookie = async server => {
    const cache = server.cache({
        segment: "sessions",
        expiresIn: 7 * 24 * 60 * 60 * 1000,
    });
    server.app.cache = cache;

    await server.register(authCookie);
    server.auth.strategy("sessions", "cookie", {
        cookie: "sid",
        password: process.env.COOKIE_AUTH_PASSWORD,
        ttl: 7 * 24 * 60 * 60 * 1000,
        isSecure: process.env.NODE_ENV === "production",
        validateFunc: async (request, session) => {
            const out = { valid: false, credentials: null };
            const cached = await cache.get(session.sid);
            if (cached) {
                out.valid = true;
                out.credentials = cached.account;
            }
            return out;
        },
    });
};

const pGithub = async server => {
    await server.register(bell);
    server.auth.strategy("github", "bell", {
        provider: "github",
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        password: process.env.GITHUB_AUTH_PASSWORD,
        isSecure: process.env.NODE_ENV === "production",
    });
};

const register = async server => {
    // log
    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== "production",
        },
    });

    // auth cookie
    await pCookie(server);

    // oauth github
    await pGithub(server);
};

export default register;
