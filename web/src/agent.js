const API = process.env.API;

const auth = r => {
    if (r.status === 401) {
        location.href = `${API}/connect/github`;
        throw new Error(r.status);
    } else {
        return r;
    }
};

const req = async (path, method, data) => {
    return fetch(`${API}${path}`, {
        method,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: data && JSON.stringify(data),
        redirect: "follow",
        mode: "cors",
        credentials: "include",
    })
        .then(auth)
        .then(r => r.json());
};

const get = async path => req(path, "GET");
const post = async (path, data) => req(path, "POST", data);
const put = async (path, data) => req(path, "PUT", data);
const del = async (path, data) => req(path, "DELETE", data);

export { get, post, put, del };
