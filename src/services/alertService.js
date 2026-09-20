import { api } from "./apiClient";

export function getAlerts() {
    return api("/alerts");
}

export function createAlert({ symbol, name, targetPrice, direction }) {
    return api("/alerts", {
        method: "POST",
        body: { symbol, name, targetPrice, direction },
    });
}

export function deleteAlert(id) {
    return api(`/alerts/${id}`, { method: "DELETE" });
}
