import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBell, FaTrash } from "react-icons/fa";
import authService from "../services/authService";
import { getAlerts, createAlert, deleteAlert } from "../services/alertService";
import { getAvatar } from "../services/profileService";
import NavBar from "../components/NavBar";
import StockSearch from "../components/StockSearch";

function Alerts() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [picked, setPicked] = useState(null);
    const [target, setTarget] = useState("");
    const [direction, setDirection] = useState("ABOVE");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            setAlerts(await getAlerts());
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const u = await authService.getCurrentUser();
                setUser({ ...u, avatarUrl: getAvatar(u.$id) });
                await load();
            } catch {
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate, load]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!picked) return setError("Pick a stock first");
        if (!target || Number(target) <= 0) return setError("Enter a valid price");
        try {
            await createAlert({
                symbol: picked.symbol,
                name: picked.name,
                targetPrice: Number(target),
                direction,
            });
            setPicked(null);
            setTarget("");
            await load();
        } catch (err) {
            setError(err.message);
        }
    };

    const remove = async (id) => {
        await deleteAlert(id);
        await load();
    };

    const logout = async () => {
        await authService.logout();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen app-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen app-bg">
            <NavBar user={user} onLogout={logout} live />
            <main className="max-w-3xl mx-auto px-6 py-8">
                <button
                    onClick={() => navigate("/home")}
                    className="flex items-center gap-2 text-muted hover:text-current mb-6"
                >
                    <FaArrowLeft /> Back to dashboard
                </button>

                <h1 className="text-2xl font-bold mb-5 flex items-center gap-2">
                    <FaBell className="text-indigo-400" /> Price Alerts
                </h1>

                <form onSubmit={submit} className="surface rounded-2xl p-5 mb-8 space-y-4">
                    <StockSearch onPick={setPicked} />
                    {picked && (
                        <p className="text-sm">
                            Selected: <span className="font-semibold">{picked.name}</span>{" "}
                            <span className="text-muted">({picked.symbol})</span>
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value)}
                            className="rounded-xl bg-white/10 px-4 py-2 outline-none"
                        >
                            <option value="ABOVE">Price rises above</option>
                            <option value="BELOW">Price falls below</option>
                        </select>
                        <input
                            type="number"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="Target ₹"
                            className="rounded-xl bg-white/10 px-4 py-2 outline-none flex-1 min-w-30"
                        />
                        <button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 font-semibold">
                            Add alert
                        </button>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </form>

                <div className="surface rounded-2xl overflow-hidden">
                    {alerts.length === 0 ? (
                        <p className="p-6 text-muted text-sm text-center">No alerts set.</p>
                    ) : (
                        alerts.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between p-4 border-b border-white/5 last:border-0"
                            >
                                <div>
                                    <p className="font-semibold text-sm">{a.name}</p>
                                    <p className="text-xs text-muted">
                                        {a.symbol} · notify when {a.direction.toLowerCase()} ₹
                                        {Number(a.targetPrice).toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {a.triggered && (
                                        <span className="text-xs text-emerald-400">Triggered</span>
                                    )}
                                    <button
                                        onClick={() => remove(a.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <FaTrash size={13} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

export default Alerts;
