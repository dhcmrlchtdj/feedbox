const auth = async r => {
    const body = await r.json();
    if (r.status === 401) {
        throw new Error(`${JSON.stringify(body)}`);
    } else {
        return body;
    }
};

const req = async (method, url, data, headers = {}) => {
    if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json; charset=utf-8";
    }
    return fetch(url, {
        method,
        headers,
        body: data && JSON.stringify(data),
        redirect: "follow",
        mode: "cors",
        credentials: "include",
    }).then(auth);
};

const get = async (url, headers) => req("GET", url, null, headers);
const post = async (url, data, headers) => req("POST", url, data, headers);
const put = async (url, data, headers) => req("PUT", url, data, headers);
const del = async (url, data, headers) => req("DELETE", url, data, headers);

export { get, post, put, del };
