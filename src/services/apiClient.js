// Shared lightweight API client. Centralizes base URL, auth header, JSON
// parsing and error handling so every service stays small and consistent.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function authHeaders(extra = {}) {
    const token = localStorage.getItem("tradepro_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: auth ? authHeaders() : { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
    }
    return data;
}

export { API_URL };
