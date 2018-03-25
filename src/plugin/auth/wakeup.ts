export default async (req, username, password, h) => {
    return {
        isValid:
            username === process.env.WAKEUP_USERNAME &&
            password === process.env.WAKEUP_PASSWORD,
        credentials: {},
    };
};
