import * as Url from "url";
import * as Path from "path";

const extractSite = (url: string): string => {
    const u = new Url.URL(url);
    switch (u.hostname) {
        case "feeds.feedburner.com":
            return `feedburner/${u.pathname}`;
        case "medium.com":
            const site = Path.basename(u.pathname);
            return `medium/${site}`;
        default:
            return u.hostname;
    }
};

export default extractSite;
