import prepare from './prepare';

import * as Hapi from 'hapi';
import plugin from './plugin';
import route from './route';

const main = async () => {
    await prepare();

    const server = Hapi.server({
        host: '0.0.0.0',
        port: Number(process.env.PORT || 8000),
    });

    await plugin(server);

    server.route(route);

    await server.start();
};

main();
