// Portfolio + wallet. Uses the Spring Boot backend when available, and falls
// back to localStorage so the UI still works if the backend isn't running.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const STORAGE_KEY = "tradepro_portfolio";
const STARTING_BALANCE = 100000;

function authHeaders() {
    const token = localStorage.getItem("tradepro_token");
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

// ---------- localStorage fallback ----------
function readLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }
    return { wallet: STARTING_BALANCE, holdings: {} };
}

function writeLocal(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
}

// Convert backend shape { wallet, holdings: [{symbol,name,quantity,avgPrice}] }
// into the app shape { wallet, holdings: { [symbol]: {symbol,name,qty,avgPrice} } }
function normalize(data) {
    const holdings = {};
    (data.holdings || []).forEach((h) => {
        holdings[h.symbol] = {
            symbol: h.symbol,
            name: h.name,
            qty: h.quantity,
            avgPrice: h.avgPrice,
        };
    });
    return { wallet: data.wallet ?? STARTING_BALANCE, holdings };
}

// ---------- Public API (all async) ----------
export async function fetchPortfolio() {
    try {
        const res = await fetch(`${API_URL}/portfolio`, { headers: authHeaders() });
        if (!res.ok) throw new Error("offline");
        return normalize(await res.json());
    } catch {
        return readLocal();
    }
}

export async function buyStock({ symbol, name, price, qty }) {
    try {
        const res = await fetch(`${API_URL}/trades/buy`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ symbol, name, price, qty }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Trade failed");
        }
        return await fetchPortfolio();
    } catch (err) {
        if (err.message && err.message !== "Failed to fetch") throw err;
        // Backend down: local fallback
        return buyLocal({ symbol, name, price, qty });
    }
}

export async function sellStock({ symbol, price, qty }) {
    try {
        const res = await fetch(`${API_URL}/trades/sell`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ symbol, price, qty }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Trade failed");
        }
        return await fetchPortfolio();
    } catch (err) {
        if (err.message && err.message !== "Failed to fetch") throw err;
        return sellLocal({ symbol, price, qty });
    }
}

export async function addFunds(amount) {
    try {
        const res = await fetch(`${API_URL}/wallet/add-funds`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ amount }),
        });
        if (!res.ok) throw new Error("offline");
        return await fetchPortfolio();
    } catch {
        const state = readLocal();
        state.wallet = Number((state.wallet + Number(amount)).toFixed(2));
        writeLocal(state);
        return state;
    }
}

function buyLocal({ symbol, name, price, qty }) {
    const state = readLocal();
    const cost = price * qty;
    if (cost > state.wallet) throw new Error("Insufficient balance for this trade");
    const existing = state.holdings[symbol];
    if (existing) {
        const totalQty = existing.qty + qty;
        existing.avgPrice = Number(
            ((existing.avgPrice * existing.qty + cost) / totalQty).toFixed(2)
        );
        existing.qty = totalQty;
    } else {
        state.holdings[symbol] = { symbol, name, qty, avgPrice: Number(price.toFixed(2)) };
    }
    state.wallet = Number((state.wallet - cost).toFixed(2));
    return writeLocal(state);
}

function sellLocal({ symbol, price, qty }) {
    const state = readLocal();
    const existing = state.holdings[symbol];
    if (!existing || existing.qty < qty)
        throw new Error("You don't own enough shares to sell");
    existing.qty -= qty;
    if (existing.qty === 0) delete state.holdings[symbol];
    state.wallet = Number((state.wallet + price * qty).toFixed(2));
    return writeLocal(state);
}

// Compute metrics against live prices. livePrices: Map<symbol, rawPrice>
export function computeMetrics(state, livePrices) {
    const holdings = Object.values(state.holdings).map((h) => {
        const last = livePrices.get(h.symbol) ?? h.avgPrice;
        const marketValue = last * h.qty;
        const invested = h.avgPrice * h.qty;
        const pnl = marketValue - invested;
        return {
            ...h,
            last,
            marketValue,
            invested,
            pnl,
            pnlPercent: invested ? (pnl / invested) * 100 : 0,
        };
    });

    const holdingsValue = holdings.reduce((s, h) => s + h.marketValue, 0);
    const invested = holdings.reduce((s, h) => s + h.invested, 0);
    const totalPnl = holdingsValue - invested;

    return {
        holdings,
        holdingsValue,
        invested,
        totalPnl,
        totalPnlPercent: invested ? (totalPnl / invested) * 100 : 0,
        totalValue: holdingsValue + state.wallet,
    };
}
