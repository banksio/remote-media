export const put = async (url: string, body: any) => {
    return fetch(url, {
        method: "PUT",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // Body data type must match "Content-Type" header
    });
};
