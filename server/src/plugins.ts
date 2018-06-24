import * as pino from 'hapi-pino';
import * as inert from 'inert';
import * as authBasic from 'hapi-auth-basic';
import * as authJWT from 'hapi-auth-jwt2';
import wakeupAuth from './lib/auth/wakeup';
import apiAuth from './lib/auth/api';

const API_KEY = Buffer.from(process.env.JWT_API_HEX as string, 'hex');

const register = async server => {
    // log
    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== 'production',
        },
    });

    // static files
    await server.register(inert);

    // auth
    await server.register(authBasic);
    server.auth.strategy('wakeupAuth', 'basic', { validate: wakeupAuth });

    await server.register(authJWT);
    server.auth.strategy('apiAuth', 'jwt', {
        key: API_KEY,
        verifyOptions: { algorithms: ['HS256'] },
        validate: apiAuth,
        urlKey: false,
    });
};

export default register;
