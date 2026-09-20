// Auth client for the Spring Boot backend (replaces Appwrite).
// The backend issues a JWT which we store in localStorage and send as a
// Bearer token on authenticated requests.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const TOKEN_KEY = "tradepro_token";

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };

    if (auth) {
        const token = getToken();
        if (!token) throw new Error("Not authenticated");
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || "Request failed");
    }

    return data;
}

// Normalize the backend user shape to what the UI expects.
// The old Appwrite code used `$id` and `name`, so we expose both.
function normalizeUser(user) {
    if (!user) return null;
    return {
        ...user,
        $id: user.id,
        name: user.fullName,
    };
}

class AuthService {
    async register({
        fullName,
        email,
        password,
        phoneNumber,
        address,
        dateOfBirth,
    }) {
        const data = await request("/auth/register", {
            method: "POST",
            body: { fullName, email, password, phoneNumber, address, dateOfBirth },
        });

        setToken(data.token);
        return normalizeUser(data.user);
    }

    async login(email, password) {
        const data = await request("/auth/login", {
            method: "POST",
            body: { email, password },
        });

        setToken(data.token);
        return normalizeUser(data.user);
    }

    async getCurrentUser() {
        const user = await request("/auth/me", { auth: true });
        return normalizeUser(user);
    }

    // Kept for compatibility with Home.jsx. The /me endpoint already
    // returns the full profile, so we just reuse it.
    async getUserDetails() {
        return this.getCurrentUser();
    }

    async logout() {
        clearToken();
    }
}

const authService = new AuthService();

export default authService;
