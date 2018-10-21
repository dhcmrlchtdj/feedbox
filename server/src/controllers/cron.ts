export const cron = {
    auth: "cron",
    async handler(request, h) {
        const user = request.auth.credentials;
        return h.response(user);
    },
};
