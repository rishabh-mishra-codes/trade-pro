import { api } from "./apiClient";

export function getOrders() {
    return api("/orders");
}

export function placeLimitOrder({ symbol, name, side, price, qty }) {
    return api("/orders/limit", {
        method: "POST",
        body: { symbol, name, side, price, qty },
    });
}

export function cancelOrder(id) {
    return api(`/orders/${id}`, { method: "DELETE" });
}
