import { useState } from "react";
import { FaTimes } from "react-icons/fa";

const PRESETS = [1000, 5000, 10000, 25000];

function AddFundsModal({ open, onClose, onPay }) {
    const [amount, setAmount] = useState(5000);
    const [processing, setProcessing] = useState(false);

    if (!open) return null;

    const handlePay = async () => {
        if (amount < 1) return;
        setProcessing(true);
        await onPay(Number(amount));
        setProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="surface w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Add Funds</h3>
                    <button onClick={onClose} className="text-muted hover:text-red-400">
                        <FaTimes />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {PRESETS.map((p) => (
                        <button
                            key={p}
                            onClick={() => setAmount(p)}
                            className={`py-2 rounded-xl text-sm font-semibold transition ${
                                amount === p
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/10 text-muted"
                            }`}
                        >
                            ₹{p / 1000}k
                        </button>
                    ))}
                </div>

                <label className="text-sm text-muted">Amount (₹)</label>
                <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full py-3 px-4 rounded-xl bg-white/10 outline-none"
                />

                <button
                    onClick={handlePay}
                    disabled={processing}
                    className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white transition disabled:opacity-60"
                >
                    {processing ? "Processing..." : `Pay ₹${Number(amount).toLocaleString("en-IN")}`}
                </button>

                <p className="mt-3 text-xs text-muted text-center">
                    Secured by Razorpay (test mode)
                </p>
            </div>
        </div>
    );
}

export default AddFundsModal;
