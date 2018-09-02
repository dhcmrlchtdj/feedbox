import prepare from "./prepare";
import * as Hapi from "hapi";
import register from "./plugin";
import routes from "./routes";

const main = async () => {
    await prepare();

    const server = Hapi.server({
        host: "0.0.0.0",
        port: Number(process.env.PORT || 8000),
    });

    await register(server);

    server.route(routes);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

main();
