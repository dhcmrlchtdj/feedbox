export default async (_req, username, password, _h) => {
    return {
        isValid:
            username === process.env.WAKEUP_USERNAME &&
            password === process.env.WAKEUP_PASSWORD,
        credentials: {},
    };
};
