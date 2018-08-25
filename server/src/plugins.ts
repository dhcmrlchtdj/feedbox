import * as pino from 'hapi-pino';
import * as inert from 'inert';

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
};

export default register;
