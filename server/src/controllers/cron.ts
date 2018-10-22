import Feed from "../models/feed";

export const cron = {
    auth: "cron",
    async handler(request, h) {
        if (!request.auth.isAuthenticated) throw new Error("cron | auth");

        const feeds = await Feed.createQueryBuilder("feed")
            .innerJoinAndSelect("feed.users", "user")
            .getMany();

        return h.response(feeds);
    },
};
