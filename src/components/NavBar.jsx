import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaChartLine,
    FaBell,
    FaUserCircle,
    FaSignOutAlt,
    FaListUl,
} from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import StockSearch from "./StockSearch";

function NavBar({ user, onLogout, live, onPickStock }) {
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-(--bg)/80 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
                <div
                    className="flex items-center gap-3 cursor-pointer shrink-0"
                    onClick={() => navigate("/home")}
                >
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <FaChartLine className="text-lg text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-bold leading-tight">TradePro</h1>
                        <p className="text-[11px] text-muted flex items-center gap-1">
                            <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    live ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                                }`}
                            />
                            {live ? "Live markets" : "Connecting"}
                        </p>
                    </div>
                </div>

                <div className="hidden md:block flex-1 max-w-sm">
                    <StockSearch onPick={onPickStock} />
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate("/orders")}
                        className="hidden sm:inline text-muted hover:text-current transition text-sm"
                        title="Orders"
                    >
                        <FaListUl />
                    </button>

                    <ThemeToggle />

                    <button
                        onClick={() => navigate("/alerts")}
                        className="text-muted hover:text-current transition"
                        title="Price alerts"
                    >
                        <FaBell />
                    </button>

                    <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-2 hover:opacity-80 transition"
                        title="Profile"
                    >
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover border border-white/20"
                            />
                        ) : (
                            <FaUserCircle className="text-2xl text-indigo-400" />
                        )}
                        <span className="hidden sm:inline text-sm">
                            {user?.fullName || user?.name || "Trader"}
                        </span>
                    </button>

                    <button
                        onClick={onLogout}
                        className="text-muted hover:text-red-400 transition"
                        title="Logout"
                    >
                        <FaSignOutAlt />
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default memo(NavBar);
