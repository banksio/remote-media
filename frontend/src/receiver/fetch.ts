import { put } from "../httpTransport";

interface putNicknameBody {
    name: string;
}

export const putNickname = async (url: string, body: putNicknameBody) => {
    return put(url, body).then(response => {
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error("Name already taken.");
            }
            throw new Error("Unhandled exception.");
        } else {
            return response.text();
        }
    });
};
