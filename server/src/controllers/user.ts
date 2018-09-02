export const info = {
    async handler(_request, _h) {
        return { name: "x" };
    },
};

export const login = {
    async handler(_request, _h) {
        return { name: "404" };
    },
};

export const logout = {
    async handler(_request, _h) {
        return { name: "404" };
    },
};
