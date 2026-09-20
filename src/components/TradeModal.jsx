import { memo, useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

const fmt = (v) =>
    Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

// mode: "buy" | "sell"
// onConfirm({ symbol, name, price, qty, orderType }) — orderType: "market" | "limit"
function TradeModal({ open, mode, stock, wallet, ownedQty = 0, onClose, onConfirm }) {
    const [qty, setQty] = useState(1);
    const [orderType, setOrderType] = useState("market");
    const [limitPrice, setLimitPrice] = useState("");
    const [error, setError] = useState("");

    // Reset form each time the modal opens for a stock.
    useEffect(() => {
        if (open && stock) {
            setQty(1);
            setOrderType("market");
            setLimitPrice(String(stock.rawPrice || ""));
            setError("");
        }
    }, [open, stock]);

    if (!open || !stock) return null;

    const marketPrice = stock.rawPrice || 0;
    const isBuy = mode === "buy";
    const effectivePrice =
        orderType === "limit" ? Number(limitPrice) || 0 : marketPrice;
    const total = effectivePrice * qty;

    const submit = () => {
        setError("");
        if (qty < 1) return setError("Quantity must be at least 1");
        if (orderType === "limit" && effectivePrice <= 0)
            return setError("Enter a valid limit price");
        if (orderType === "market" && isBuy && total > wallet)
            return setError("Insufficient balance");
        if (!isBuy && qty > ownedQty)
            return setError(`You only own ${ownedQty} shares`);
        onConfirm({
            symbol: stock.symbol,
            name: stock.name,
            price: effectivePrice,
            qty,
            orderType,
        });
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="surface w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">
                        {isBuy ? "Buy" : "Sell"} {stock.name}
                    </h3>
                    <button onClick={onClose} className="text-muted hover:text-red-400">
                        <FaTimes />
                    </button>
                </div>

                {/* Order type toggle */}
                <div className="flex gap-1 rounded-xl bg-white/5 p-1 mb-4">
                    {["market", "limit"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setOrderType(t)}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize transition ${
                                orderType === t
                                    ? "bg-indigo-600 text-white"
                                    : "text-muted"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted">Symbol</span>
                        <span className="font-semibold">{stock.symbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted">Market Price</span>
                        <span className="font-semibold">₹{fmt(marketPrice)}</span>
                    </div>

                    {orderType === "limit" && (
                        <div>
                            <label className="text-sm text-muted">Limit Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="mt-1 w-full h-10 rounded-xl bg-white/10 px-3 outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-sm text-muted">Quantity</label>
                        <div className="mt-1 flex items-center gap-2">
                            <button
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="h-10 w-10 rounded-xl bg-white/10 font-bold"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                                className="h-10 flex-1 rounded-xl bg-white/10 text-center outline-none"
                            />
                            <button
                                onClick={() => setQty((q) => q + 1)}
                                className="h-10 w-10 rounded-xl bg-white/10 font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-white/10 pt-3">
                        <span className="text-muted">
                            {orderType === "limit" ? "Order Value" : "Total"}
                        </span>
                        <span className="text-lg font-bold">₹{fmt(total)}</span>
                    </div>

                    {!isBuy && (
                        <p className="text-xs text-muted">You own {ownedQty} shares</p>
                    )}
                    {isBuy && (
                        <p className="text-xs text-muted">
                            Available balance: ₹{fmt(wallet)}
                        </p>
                    )}
                    {orderType === "limit" && (
                        <p className="text-xs text-muted">
                            Limit orders are placed as pending and appear in Order History.
                        </p>
                    )}

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                        onClick={submit}
                        className={`w-full py-3 rounded-xl font-semibold transition ${
                            isBuy
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-red-600 hover:bg-red-700"
                        } text-white`}
                    >
                        {orderType === "limit" ? "Place Limit Order" : `Confirm ${isBuy ? "Buy" : "Sell"}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(TradeModal);
