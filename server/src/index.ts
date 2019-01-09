import prepare from "./prepare";
import * as Hapi from "hapi";
import plugins from "./plugins";
import routes from "./routes";

const main = async (): Promise<void> => {
    await prepare();

    const server = Hapi.server({
        host: "0.0.0.0",
        port: Number(process.env.PORT || 8000),
        routes: {
            payload: { allow: ["application/json"] },
            // cors: {
                // headers: [
                    // "Accept",
                    // "Authorization",
                    // "Content-Type",
                    // "If-None-Match",
                    // "Content-Type",
                    // "X-SW-Strategy",
                    // "X-SW-Race",
                    // "X-SW-Action",
                // ],
                // credentials: true,
            // },
        },
    });

    await plugins(server);

    server.route(routes);

    await server.start();
};

main();
