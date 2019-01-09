const API = process.env.API;

const auth = r => {
    if (r.status === 401) {
        location.href = `${API}/api/connect/github`;
        throw new Error(r.status);
    } else {
        return r;
    }
};

const req = async (method, path, data, headers = {}) => {
    if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json; charset=utf-8";
    }
    return fetch(`${API}${path}`, {
        method,
        headers,
        body: data && JSON.stringify(data),
        redirect: "follow",
        mode: "cors",
        credentials: "include",
    })
        .then(auth)
        .then(r => r.json());
};

const get = async (path, headers) => req("GET", path, null, headers);
const post = async (path, data, headers) => req("POST", path, data, headers);
const put = async (path, data, headers) => req("PUT", path, data, headers);
const del = async (path, data, headers) => req("DELETE", path, data, headers);

export { get, post, put, del };
