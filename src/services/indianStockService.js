// Indian (NSE) live stock data via Twelve Data.
// Free tier: ~800 requests/day, 8 requests/min. No WebSocket, so we poll.
// Get a free key at https://twelvedata.com/pricing (Free plan).

const API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const BASE_URL = "https://api.twelvedata.com";

// NSE-listed stocks. The ":NSE" suffix tells Twelve Data which exchange to use.
export const INDIAN_STOCKS = [
    { symbol: "RELIANCE:NSE", name: "Reliance Industries" },
    { symbol: "TCS:NSE", name: "Tata Consultancy Services" },
    { symbol: "INFY:NSE", name: "Infosys" },
    { symbol: "HDFCBANK:NSE", name: "HDFC Bank" },
    { symbol: "ICICIBANK:NSE", name: "ICICI Bank" },
    { symbol: "SBIN:NSE", name: "State Bank of India" },
    { symbol: "TATAMOTORS:NSE", name: "Tata Motors" },
    { symbol: "WIPRO:NSE", name: "Wipro" },
];

export const INDIAN_SYMBOLS = INDIAN_STOCKS.map((stock) => stock.symbol);

function formatMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "--";
    return n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatSigned(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "--";
    const abs = Math.abs(n).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return n >= 0 ? `+${abs}` : `-${abs}`;
}

function mapStockQuote(meta, quote = {}) {
    const price = Number(quote.close) || Number(quote.price) || 0;
    const previousClose = Number(quote.previous_close) || 0;
    const change =
        Number(quote.change) ||
        (previousClose ? price - previousClose : 0);
    const percent =
        Number(quote.percent_change) ||
        (previousClose ? (change / previousClose) * 100 : 0);

    return {
        name: meta.name,
        symbol: meta.symbol,
        previousClose,
        rawPrice: price,
        rawChange: change,
        price: formatMoney(price),
        value: formatMoney(price),
        change: formatSigned(change),
        percentage: `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`,
        positive: change >= 0,
    };
}

// Custom error so callers can detect rate limiting (HTTP 429 / TwelveData 429).
export class RateLimitError extends Error {
    constructor(message) {
        super(message || "API rate limit reached");
        this.name = "RateLimitError";
        this.rateLimited = true;
    }
}

async function fetchTwelveData(path, params = {}) {
    if (!API_KEY) {
        throw new Error("Missing VITE_TWELVE_DATA_API_KEY");
    }

    const url = `${BASE_URL}${path}?${new URLSearchParams({
        ...params,
        apikey: API_KEY,
    })}`;

    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    // Twelve Data returns code 429 (and HTTP 429) when the rate limit is hit.
    if (response.status === 429 || data.code === 429) {
        throw new RateLimitError(data.message || "API rate limit reached");
    }

    if (!response.ok || data.status === "error" || data.code >= 400) {
        throw new Error(data.message || "Failed to fetch Twelve Data");
    }

    return data;
}

// Cache quotes for 60s to stay well within the free tier (8 req/min, 800/day).
// On a rate-limit error we serve the last cached data (even if stale) so the
// UI keeps working instead of breaking.
const quoteCache = new Map(); // key -> { at, data }
const CACHE_MS = 60000;

export async function getQuotesFor(stocks) {
    if (!stocks?.length) return [];
    const symbols = stocks.map((s) => s.symbol);
    const key = symbols.join(",");

    const cached = quoteCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
        return cached.data;
    }

    let data;
    try {
        data = await fetchTwelveData("/quote", { symbol: key });
    } catch (err) {
        // If we hit the rate limit but have older cached data, reuse it.
        if (err.rateLimited && cached) return cached.data;
        throw err;
    }

    const quotes = stocks.map((stock) => {
        const quote = symbols.length === 1 ? data : data[stock.symbol];
        return mapStockQuote(stock, quote || {});
    });

    quoteCache.set(key, { at: Date.now(), data: quotes });
    return quotes;
}

export async function getIndianQuotes(watchStocks = INDIAN_STOCKS) {
    const quotes = await getQuotesFor(watchStocks);

    const ranked = [...quotes].sort(
        (a, b) => Math.abs(b.rawChange) - Math.abs(a.rawChange)
    );

    return {
        indices: quotes.slice(0, 4),
        watchlist: quotes,
        topGainers: ranked.filter((stock) => stock.positive).slice(0, 3),
        topLosers: ranked.filter((stock) => !stock.positive).slice(0, 3),
    };
}

// Historical/intraday candles for a symbol (for live charts).
// interval examples: "5min", "15min", "1h", "1day"
// Cached for 60s per (symbol, interval) to avoid burning the rate limit when
// the user switches theme or re-selects the same stock.
const seriesCache = new Map();

export async function getTimeSeries(symbol, interval = "5min", outputsize = 100) {
    const cacheKey = `${symbol}|${interval}|${outputsize}`;
    const cached = seriesCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 60000) {
        return cached.data;
    }

    let data;
    try {
        data = await fetchTwelveData("/time_series", {
            symbol,
            interval,
            outputsize: String(outputsize),
            order: "ASC",
        });
    } catch (err) {
        if (err.rateLimited && cached) return cached.data;
        throw err;
    }

    const values = Array.isArray(data.values) ? data.values : [];

    // lightweight-charts wants { time, open, high, low, close } ascending.
    const mapped = values.map((v) => {
        const ts = Math.floor(new Date(v.datetime.replace(" ", "T")).getTime() / 1000);
        return {
            time: ts,
            open: Number(v.open),
            high: Number(v.high),
            low: Number(v.low),
            close: Number(v.close),
        };
    });

    seriesCache.set(cacheKey, { at: Date.now(), data: mapped });
    return mapped;
}
