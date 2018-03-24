import * as authBasic from 'hapi-auth-basic';
import * as pino from 'hapi-pino';

const register = async server => {
    await server.register(authBasic);
    server.auth.strategy('wakeupAuth', 'basic', {
        async validate(req, username, password, h) {
            return {
                isValid:
                    username === process.env.WAKEUP_USERNAME &&
                    password === process.env.WAKEUP_PASSWORD,
                credentials: {},
            };
        },
    });

    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== 'production',
        },
    });
};

export default register;
