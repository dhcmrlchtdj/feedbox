const auth = async server => {
    server.auth.strategy("github", "bell", {
        provider: "github",
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        password: process.env.GITHUB_AUTH_SECRET,
        isSecure: process.env.NODE_ENV === "production",
    });
};

export default auth;
