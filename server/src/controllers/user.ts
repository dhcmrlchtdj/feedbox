// import { getConnection } from "typeorm";

export const info = {
    async handler(_request, _h) {
        // const conn = getConnection();
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
