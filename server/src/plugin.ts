import * as pino from "hapi-pino";
import * as bell from "bell";
import * as crypto from "crypto";

const register = async server => {
    // log
    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== "production",
        },
    });

    // oauth
    await server.register(bell);
    server.auth.strategy("github", "bell", {
        provider: "github",
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        password: crypto.randomBytes(32).toString("hex"),
        isSecure: process.env.NODE_ENV === "production",
    });
};

export default register;
