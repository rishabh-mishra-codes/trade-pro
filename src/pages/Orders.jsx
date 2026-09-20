import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import authService from "../services/authService";
import { getOrders, cancelOrder } from "../services/orderService";
import NavBar from "../components/NavBar";
import { getAvatar } from "../services/profileService";

const fmt = (v) =>
    Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

function Orders() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setOrders(await getOrders());
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

    const handleCancel = async (id) => {
        try {
            await cancelOrder(id);
            await load();
        } catch {
            /* ignore */
        }
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

    const badge = (status) =>
        ({
            EXECUTED: "bg-emerald-500/20 text-emerald-400",
            PENDING: "bg-yellow-500/20 text-yellow-400",
            CANCELLED: "bg-slate-500/20 text-slate-400",
        }[status] || "bg-slate-500/20 text-slate-400");

    return (
        <div className="min-h-screen app-bg">
            <NavBar user={user} onLogout={logout} live />
            <main className="max-w-5xl mx-auto px-6 py-8">
                <button
                    onClick={() => navigate("/home")}
                    className="flex items-center gap-2 text-muted hover:text-current mb-6"
                >
                    <FaArrowLeft /> Back to dashboard
                </button>

                <h1 className="text-2xl font-bold mb-5">Order History</h1>

                <div className="surface rounded-2xl overflow-hidden">
                    {orders.length === 0 ? (
                        <p className="p-6 text-muted text-sm text-center">
                            No orders yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-muted text-xs border-b border-white/10">
                                    <tr>
                                        <th className="text-left p-4">Stock</th>
                                        <th className="text-left p-4">Side</th>
                                        <th className="text-left p-4">Type</th>
                                        <th className="text-right p-4">Qty</th>
                                        <th className="text-right p-4">Price</th>
                                        <th className="text-left p-4">Status</th>
                                        <th className="text-right p-4">Date</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id} className="border-b border-white/5">
                                            <td className="p-4">
                                                <p className="font-semibold">{o.name}</p>
                                                <p className="text-xs text-muted">{o.symbol}</p>
                                            </td>
                                            <td
                                                className={`p-4 font-semibold ${
                                                    o.side === "BUY"
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {o.side}
                                            </td>
                                            <td className="p-4">{o.type}</td>
                                            <td className="text-right p-4">{o.quantity}</td>
                                            <td className="text-right p-4">₹{fmt(o.price)}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge(
                                                        o.status
                                                    )}`}
                                                >
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="text-right p-4 text-xs text-muted">
                                                {new Date(o.createdAt).toLocaleString("en-IN")}
                                            </td>
                                            <td className="text-right p-4">
                                                {o.status === "PENDING" && (
                                                    <button
                                                        onClick={() => handleCancel(o.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Cancel order"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Orders;
