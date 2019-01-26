import * as Feed from "./controllers/feed";
import * as User from "./controllers/user";
import * as Cron from "./controllers/cron";

const icon = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42gEFAPr/AP///wAI/AL+Sr4t6gAAAABJRU5ErkJggg",
    "base64",
);

const routes = [
    { path: "/api/v1/feeds", method: "get", options: Feed.list },
    { path: "/api/v1/feeds/add", method: "put", options: Feed.add },
    { path: "/api/v1/feeds/remove", method: "delete", options: Feed.remove },
    { path: "/api/v1/feeds/import", method: "post", options: Feed.importFeeds },
    { path: "/api/v1/feeds/export", method: "get", options: Feed.exportFeeds },

    { path: "/api/v1/cron", method: "get", options: Cron.cron },

    { path: "/api/v1/user", method: "get", options: User.info },
    { path: "/api/logout", method: "get", options: User.logout },
    { path: "/api/connect/github", method: "get", options: User.connectGithub },

    {
        path: "/favicon.ico",
        method: "get",
        options: { auth: false },
        async handler(_request, h) {
            return h.response(icon).type("image/png");
        },
    },
];

export default routes;
