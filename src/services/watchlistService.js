import { api } from "./apiClient";

export function getWatchlist() {
    return api("/watchlist");
}

export function addToWatchlist(symbol, name) {
    return api("/watchlist", { method: "POST", body: { symbol, name } });
}

export function removeFromWatchlist(symbol) {
    return api(`/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" });
}

export function searchStocks(q, limit = 10) {
    return api(
        `/market/search?q=${encodeURIComponent(q)}&limit=${limit}`,
        { auth: true }
    );
}
