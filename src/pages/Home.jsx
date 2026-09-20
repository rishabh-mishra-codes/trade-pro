import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowUp,
    FaArrowDown,
    FaWallet,
    FaPlus,
    FaMinus,
    FaChartLine,
    FaTrash,
} from "react-icons/fa";

import { getQuotesFor, INDIAN_STOCKS } from "../services/indianStockService";
import authService from "../services/authService";
import {
    fetchPortfolio,
    buyStock,
    sellStock,
    computeMetrics,
} from "../services/portfolioService";
import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
} from "../services/watchlistService";
import { placeLimitOrder } from "../services/orderService";
import { getAvatar } from "../services/profileService";
import { payWithRazorpay } from "../services/paymentService";
import { useTheme } from "../context/ThemeContext";

import NavBar from "../components/NavBar";
import StockChart from "../components/StockChart";
import TradeModal from "../components/TradeModal";
import AddFundsModal from "../components/AddFundsModal";
import ChatBot from "../components/ChatBot";

const fmt = (v) =>
    Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

// Real Indian market indices via Twelve Data index symbols.
const INDEX_STOCKS = [
    { symbol: "NIFTY 50:NSE", name: "NIFTY 50" },
    { symbol: "SENSEX:BSE", name: "SENSEX" },
];

function Home() {
    const navigate = useNavigate();
    const { setThemeFromServer } = useTheme();

    const [user, setUser] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(true);

    const [marketLoading, setMarketLoading] = useState(true);
    const [marketError, setMarketError] = useState("");
    const [live, setLive] = useState(false);
    const [indices, setIndices] = useState([]);
    const [watchStocks, setWatchStocks] = useState([]); // [{symbol,name}]
    const [quotes, setQuotes] = useState([]); // enriched quotes for watchStocks
    const [topGainers, setTopGainers] = useState([]);
    const [topLosers, setTopLosers] = useState([]);

    const [portfolio, setPortfolio] = useState({ wallet: 0, holdings: {} });
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    const [tradeModal, setTradeModal] = useState({ open: false, mode: "buy", stock: null });
    const [fundsOpen, setFundsOpen] = useState(false);
    const [toast, setToast] = useState("");

    // Keep the current watchStocks in a ref so the poll interval always reads
    // the latest list without needing to be re-created on every change.
    const watchRef = useRef(watchStocks);
    watchRef.current = watchStocks;

    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }, []);

    // Initial load: user + portfolio + watchlist
    useEffect(() => {
        const load = async () => {
            try {
                const current = await authService.getCurrentUser();
                setUser(current);
                setAvatar(getAvatar(current.$id));
                if (current.theme) setThemeFromServer(current.theme);

                const [pf, wl] = await Promise.all([
                    fetchPortfolio(),
                    getWatchlist().catch(() => null),
                ]);
                setPortfolio(pf);
                setWatchStocks(
                    wl && wl.length
                        ? wl.map((w) => ({ symbol: w.symbol, name: w.name }))
                        : INDIAN_STOCKS.slice(0, 5)
                );
            } catch {
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate, setThemeFromServer]);

    // Poll market data for indices + current watchlist. Runs once; reads the
    // watchlist from a ref so we don't reset the timer on every edit.
    useEffect(() => {
        let mounted = true;

        const loadMarket = async () => {
            const stocks = watchRef.current;
            if (!stocks.length) {
                setMarketLoading(false);
                return;
            }
            try {
                const [q, idx] = await Promise.all([
                    getQuotesFor(stocks),
                    getQuotesFor(INDEX_STOCKS).catch(() => []),
                ]);
                if (!mounted) return;

                setQuotes(q);
                setIndices(idx.length ? idx : q.slice(0, 4));
                const ranked = [...q].sort(
                    (a, b) => Math.abs(b.rawChange) - Math.abs(a.rawChange)
                );
                setTopGainers(ranked.filter((s) => s.positive).slice(0, 3));
                setTopLosers(ranked.filter((s) => !s.positive).slice(0, 3));
                setLive(true);
                setMarketError("");

                setSelectedSymbol((cur) => cur || q[0]?.symbol || null);
            } catch (err) {
                if (mounted) {
                    setLive(false);
                    setMarketError(err.message || "Failed to load market data");
                }
            } finally {
                if (mounted) setMarketLoading(false);
            }
        };

        loadMarket();
        const timer = setInterval(loadMarket, 15000);
        return () => {
            mounted = false;
            clearInterval(timer);
        };
    }, []);

    const livePrices = useMemo(() => {
        const map = new Map();
        quotes.forEach((s) => map.set(s.symbol, s.rawPrice));
        return map;
    }, [quotes]);

    const metrics = useMemo(
        () => computeMetrics(portfolio, livePrices),
        [portfolio, livePrices]
    );

    const openTrade = useCallback(
        (mode, stock) => setTradeModal({ open: true, mode, stock }),
        []
    );

    const confirmTrade = useCallback(
        async ({ symbol, name, price, qty, orderType }) => {
            try {
                if (orderType === "limit") {
                    await placeLimitOrder({
                        symbol,
                        name,
                        side: tradeModal.mode === "buy" ? "BUY" : "SELL",
                        price,
                        qty,
                    });
                    showToast(`Limit ${tradeModal.mode} order placed for ${name}`);
                } else {
                    const updated =
                        tradeModal.mode === "buy"
                            ? await buyStock({ symbol, name, price, qty })
                            : await sellStock({ symbol, price, qty });
                    setPortfolio({ ...updated });
                    showToast(
                        `${tradeModal.mode === "buy" ? "Bought" : "Sold"} ${qty} ${name}`
                    );
                }
                setTradeModal({ open: false, mode: "buy", stock: null });
            } catch (err) {
                showToast(err.message);
            }
        },
        [tradeModal.mode, showToast]
    );

    const handleAddFunds = useCallback(
        async (amount) => {
            await payWithRazorpay({
                amount,
                user,
                onSuccess: async (r) => {
                    setPortfolio(await fetchPortfolio());
                    setFundsOpen(false);
                    showToast(
                        r.demo
                            ? `Added ₹${fmt(amount)} (demo mode)`
                            : `Payment successful: ₹${fmt(amount)}`
                    );
                },
                onFailure: (msg) => showToast(msg),
            });
        },
        [user, showToast]
    );

    const handleAddStock = useCallback(
        async (stock) => {
            if (watchRef.current.some((s) => s.symbol === stock.symbol)) {
                showToast(`${stock.name} is already in your watchlist`);
                return;
            }
            setWatchStocks((cur) => [...cur, { symbol: stock.symbol, name: stock.name }]);
            try {
                await addToWatchlist(stock.symbol, stock.name);
                const q = await getQuotesFor(watchRef.current);
                setQuotes(q);
                showToast(`Added ${stock.name}`);
            } catch {
                showToast("Could not save to watchlist");
            }
        },
        [showToast]
    );

    const handleRemoveStock = useCallback(async (symbol) => {
        setWatchStocks((cur) => cur.filter((s) => s.symbol !== symbol));
        setQuotes((cur) => cur.filter((s) => s.symbol !== symbol));
        try {
            await removeFromWatchlist(symbol);
        } catch {
            /* ignore */
        }
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        navigate("/");
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen app-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const selectedStock =
        quotes.find((s) => s.symbol === selectedSymbol) || quotes[0];
    const ownedQty = tradeModal.stock
        ? portfolio.holdings[tradeModal.stock.symbol]?.qty || 0
        : 0;

    return (
        <div className="min-h-screen app-bg">
            <NavBar
                user={{ ...user, avatarUrl: avatar }}
                onLogout={logout}
                live={live}
                onPickStock={handleAddStock}
            />

            {/* Ticker */}
            <div className="border-b border-white/10 bg-black/10">
                <div className="max-w-7xl mx-auto px-6 py-2.5 flex gap-8 overflow-x-auto items-center">
                    <span
                        className={`text-xs font-bold whitespace-nowrap ${
                            live ? "text-emerald-400" : "text-muted"
                        }`}
                    >
                        {live ? "● LIVE" : "○ CONNECTING"}
                    </span>
                    {indices.map((m) => (
                        <div key={m.symbol} className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm text-muted">{m.name}</span>
                            <span className="font-semibold text-sm">₹{m.value}</span>
                            <span
                                className={`text-xs ${
                                    m.positive ? "text-emerald-400" : "text-red-400"
                                }`}
                            >
                                {m.percentage}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {marketError && <p className="mb-4 text-sm text-red-400">{marketError}</p>}

                {/* Portfolio summary cards */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in">
                    <SummaryCard
                        label="Total Value"
                        value={`₹${fmt(metrics.totalValue)}`}
                        icon={<FaChartLine />}
                        accent="from-indigo-500 to-purple-600"
                    />
                    <SummaryCard
                        label="Available Cash"
                        value={`₹${fmt(portfolio.wallet)}`}
                        icon={<FaWallet />}
                        accent="from-sky-500 to-cyan-600"
                        action={
                            <button
                                onClick={() => setFundsOpen(true)}
                                className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                                + Add funds
                            </button>
                        }
                    />
                    <SummaryCard
                        label="Holdings Value"
                        value={`₹${fmt(metrics.holdingsValue)}`}
                        icon={<FaChartLine />}
                        accent="from-emerald-500 to-teal-600"
                    />
                    <SummaryCard
                        label="Total P&L"
                        value={`${metrics.totalPnl >= 0 ? "+" : "-"}₹${fmt(Math.abs(metrics.totalPnl))}`}
                        sub={`${metrics.totalPnlPercent >= 0 ? "+" : ""}${metrics.totalPnlPercent.toFixed(2)}%`}
                        icon={metrics.totalPnl >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                        accent={
                            metrics.totalPnl >= 0
                                ? "from-emerald-500 to-green-600"
                                : "from-red-500 to-rose-600"
                        }
                        valueClass={metrics.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}
                    />
                </section>

                {/* Chart + watchlist */}
                <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {selectedStock ? (
                            <StockChart symbol={selectedStock.symbol} name={selectedStock.name} />
                        ) : (
                            <div className="surface rounded-2xl h-100 flex items-center justify-center text-muted">
                                Loading chart...
                            </div>
                        )}

                        {selectedStock && (
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    onClick={() => openTrade("buy", selectedStock)}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
                                >
                                    <FaPlus size={12} /> Buy {selectedStock.symbol.split(":")[0]}
                                </button>
                                <button
                                    onClick={() => openTrade("sell", selectedStock)}
                                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
                                >
                                    <FaMinus size={12} /> Sell {selectedStock.symbol.split(":")[0]}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Watchlist */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold">Watchlist</h2>
                            <span className="text-xs text-muted">
                                {watchStocks.length} stocks
                            </span>
                        </div>
                        <div className="surface rounded-2xl overflow-hidden">
                            {marketLoading && quotes.length === 0 && (
                                <p className="p-5 text-muted text-sm">Loading quotes...</p>
                            )}
                            {quotes.map((stock) => (
                                <WatchRow
                                    key={stock.symbol}
                                    stock={stock}
                                    selected={selectedSymbol === stock.symbol}
                                    onSelect={setSelectedSymbol}
                                    onRemove={handleRemoveStock}
                                />
                            ))}
                            {!marketLoading && quotes.length === 0 && (
                                <p className="p-5 text-muted text-sm">
                                    Search above to add stocks.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Holdings */}
                <section className="mt-10">
                    <h2 className="text-lg font-bold mb-3">Your Holdings</h2>
                    <div className="surface rounded-2xl overflow-hidden">
                        {metrics.holdings.length === 0 ? (
                            <p className="p-6 text-muted text-sm text-center">
                                No holdings yet. Select a stock and hit Buy to get started.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-muted text-xs border-b border-white/10">
                                        <tr>
                                            <th className="text-left p-4">Stock</th>
                                            <th className="text-right p-4">Qty</th>
                                            <th className="text-right p-4">Avg</th>
                                            <th className="text-right p-4">LTP</th>
                                            <th className="text-right p-4">Value</th>
                                            <th className="text-right p-4">P&L</th>
                                            <th className="text-right p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.holdings.map((h) => (
                                            <tr key={h.symbol} className="border-b border-white/5">
                                                <td className="p-4">
                                                    <p className="font-semibold">{h.name}</p>
                                                    <p className="text-xs text-muted">{h.symbol}</p>
                                                </td>
                                                <td className="text-right p-4">{h.qty}</td>
                                                <td className="text-right p-4">₹{fmt(h.avgPrice)}</td>
                                                <td className="text-right p-4">₹{fmt(h.last)}</td>
                                                <td className="text-right p-4">₹{fmt(h.marketValue)}</td>
                                                <td
                                                    className={`text-right p-4 ${
                                                        h.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                                                    }`}
                                                >
                                                    {h.pnl >= 0 ? "+" : "-"}₹{fmt(Math.abs(h.pnl))}
                                                    <span className="block text-xs">
                                                        {h.pnlPercent >= 0 ? "+" : ""}
                                                        {h.pnlPercent.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="text-right p-4">
                                                    <button
                                                        onClick={() =>
                                                            openTrade("sell", {
                                                                symbol: h.symbol,
                                                                name: h.name,
                                                                rawPrice: h.last,
                                                            })
                                                        }
                                                        className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs"
                                                    >
                                                        Sell
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Movers */}
                <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    <MoverCard title="Top Gainers" color="text-emerald-400" items={topGainers} />
                    <MoverCard title="Top Losers" color="text-red-400" items={topLosers} />
                </section>
            </main>

            <TradeModal
                open={tradeModal.open}
                mode={tradeModal.mode}
                stock={tradeModal.stock}
                wallet={portfolio.wallet}
                ownedQty={ownedQty}
                onClose={() => setTradeModal({ open: false, mode: "buy", stock: null })}
                onConfirm={confirmTrade}
            />

            <AddFundsModal
                open={fundsOpen}
                onClose={() => setFundsOpen(false)}
                onPay={handleAddFunds}
            />

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 surface px-5 py-3 rounded-xl shadow-2xl text-sm font-medium">
                    {toast}
                </div>
            )}

            <ChatBot />
        </div>
    );
}

const WatchRow = memo(function WatchRow({ stock, selected, onSelect, onRemove }) {
    return (
        <div
            className={`group flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition ${
                selected ? "bg-white/5" : ""
            }`}
        >
            <button
                onClick={() => onSelect(stock.symbol)}
                className="flex-1 text-left"
            >
                <p className="font-semibold text-sm">{stock.name}</p>
                <p className="text-xs text-muted">{stock.symbol}</p>
            </button>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="font-semibold text-sm">₹{stock.price}</p>
                    <p
                        className={`text-xs ${
                            stock.positive ? "text-emerald-400" : "text-red-400"
                        }`}
                    >
                        {stock.percentage}
                    </p>
                </div>
                <button
                    onClick={() => onRemove(stock.symbol)}
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition"
                    title="Remove"
                >
                    <FaTrash size={11} />
                </button>
            </div>
        </div>
    );
});

const SummaryCard = memo(function SummaryCard({ label, value, sub, icon, accent, action, valueClass }) {
    return (
        <div className="surface card-hover rounded-2xl p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted font-medium">{label}</p>
                <div
                    className={`h-9 w-9 rounded-xl bg-linear-to-br ${accent} flex items-center justify-center text-white text-sm shadow-lg`}
                >
                    {icon}
                </div>
            </div>
            <p className={`text-2xl font-extrabold mt-3 tracking-tight ${valueClass || ""}`}>
                {value}
            </p>
            {sub && <p className={`text-sm mt-0.5 ${valueClass || "text-muted"}`}>{sub}</p>}
            {action}
        </div>
    );
});

const MoverCard = memo(function MoverCard({ title, color, items }) {
    return (
        <div className="surface rounded-2xl p-5">
            <h3 className={`font-bold mb-3 ${color}`}>{title}</h3>
            {items.length === 0 && <p className="text-muted text-sm">No data yet.</p>}
            {items.map((s) => (
                <div
                    key={s.symbol}
                    className="flex justify-between py-3 border-b border-white/5 last:border-0"
                >
                    <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted">₹{fmt(s.rawPrice)}</p>
                    </div>
                    <span className={color}>{s.percentage}</span>
                </div>
            ))}
        </div>
    );
});

export default Home;
