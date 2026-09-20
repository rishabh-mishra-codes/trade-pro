import { FaChartLine, FaBolt, FaShieldAlt, FaRobot } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";

// Modern split-screen auth shell: branded showcase panel on the left,
// the form card on the right. Collapses to a single column on mobile.
function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Branding / showcase panel */}
            <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-800 to-purple-900 p-12 text-white">
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

                <div className="relative flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                        <FaChartLine className="text-xl" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight">TradePro</span>
                </div>

                <div className="relative">
                    <h2 className="text-4xl font-extrabold leading-tight">
                        Trade the Indian markets,
                        <br /> the smart way.
                    </h2>
                    <p className="mt-4 text-white/70 max-w-md">
                        Live NSE prices, real-time charts, an AI assistant, and a
                        portfolio dashboard built for 2026.
                    </p>

                    <div className="mt-10 space-y-4">
                        <Feature icon={<FaBolt />} text="Live quotes & candlestick charts" />
                        <Feature icon={<FaRobot />} text="AI assistant for your portfolio" />
                        <Feature icon={<FaShieldAlt />} text="Bank-grade JWT security" />
                    </div>
                </div>

                <p className="relative text-xs text-white/40">
                    © {new Date().getFullYear()} TradePro. Demo platform.
                </p>
            </div>

            {/* Form panel */}
            <div className="relative flex items-center justify-center p-6 sm:p-10">
                <div className="absolute top-5 right-5">
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-md animate-in">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                            <FaChartLine />
                        </div>
                        <span className="text-lg font-bold">TradePro</span>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                    {subtitle && <p className="text-muted mt-2">{subtitle}</p>}

                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, text }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-sm">
                {icon}
            </div>
            <span className="text-sm text-white/85">{text}</span>
        </div>
    );
}

export default AuthLayout;
