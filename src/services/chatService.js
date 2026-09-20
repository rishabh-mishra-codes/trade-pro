import { api } from "./apiClient";

export function sendChatMessage(message) {
    return api("/chat", { method: "POST", body: { message } });
}
