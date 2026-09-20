import { api } from "./apiClient";

export function saveTheme(theme) {
    // Fire-and-forget; ignore errors (e.g. not logged in / backend down).
    return api("/profile/theme", { method: "PUT", body: { theme } }).catch(
        () => {}
    );
}
