import * as pino from 'hapi-pino';
import * as authBasic from 'hapi-auth-basic';
import * as authJWT from 'hapi-auth-jwt2';

import wakeupAuth from './auth/wakeup';
import apiAuth from './auth/api';

const API_KEY = Buffer.from(process.env.JWT_API_HEX as string, 'hex');

const register = async server => {
    await server.register(authBasic);
    server.auth.strategy('wakeupAuth', 'basic', { validate: wakeupAuth });

    await server.register(authJWT);
    server.auth.strategy('apiAuth', 'jwt', {
        key: API_KEY,
        verifyOptions: { algorithms: ['HS256'] },
        validate: apiAuth,
        urlKey: false,
    });

    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== 'production',
        },
    });
};

export default register;
