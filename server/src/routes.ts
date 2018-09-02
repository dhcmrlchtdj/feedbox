import * as Wakeup from "./controllers/wakeup";
import * as User from "./controllers/user";
import * as Feed from "./controllers/feed";

const routes = [
    { path: "/api/v1/feeds", method: "get", options: Feed.getAll },
    { path: "/api/v1/feeds/add", method: "put", options: Feed.add },
    { path: "/api/v1/feeds/remove", method: "delete", options: Feed.remove },
    { path: "/api/v1/feeds/import", method: "post", options: Feed.importFeeds },
    { path: "/api/v1/feeds/export", method: "get", options: Feed.exportFeeds },

    { path: "/api/v1/user", method: "get", options: User.info },
    { path: "/api/v1/login", method: "post", options: User.login },
    { path: "/api/v1/logout", method: "post", options: User.logout },

    { path: "/api/v1/wakeup", method: "get", options: Wakeup.wakeup },
];

export default routes;
