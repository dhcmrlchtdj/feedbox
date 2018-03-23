import 'make-promises-safe';
import * as Hapi from 'hapi';
import * as pino from 'hapi-pino';

import route from './route';

const init = async () => {
    const server = new Hapi.server({
        host: '0.0.0.0',
        port: Number(process.env.PORT || 8000),
    });

    server.route(route);

    await server.register({
        plugin: pino,
        options: {
            prettyPrint: process.env.NODE_ENV !== 'production',
        },
    });

    await server.start();
};

init();
