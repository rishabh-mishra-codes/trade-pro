import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, ColorType } from "lightweight-charts";
import { getTimeSeries } from "../services/indianStockService";
import { useTheme } from "../context/ThemeContext";

const INTERVALS = [
    { label: "5m", value: "5min" },
    { label: "15m", value: "15min" },
    { label: "1H", value: "1h" },
    { label: "1D", value: "1day" },
];

function StockChart({ symbol, name }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const { theme } = useTheme();

    const [interval, setInterval] = useState("15min");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create the chart once.
    useEffect(() => {
        if (!containerRef.current) return;

        const isDark = theme === "dark";
        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: isDark ? "#94a3b8" : "#475569",
            },
            grid: {
                vertLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
                horzLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
            },
            rightPriceScale: { borderColor: "rgba(148,163,184,0.2)" },
            timeScale: { borderColor: "rgba(148,163,184,0.2)", timeVisible: true },
            autoSize: true,
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#10b981",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#10b981",
            wickDownColor: "#ef4444",
        });

        chartRef.current = chart;
        seriesRef.current = series;

        return () => {
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [theme]);

    // Load data whenever symbol/interval changes.
    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!symbol) return;
            setLoading(true);
            setError("");
            try {
                const candles = await getTimeSeries(symbol, interval, 120);
                if (active && seriesRef.current && candles.length) {
                    seriesRef.current.setData(candles);
                    chartRef.current?.timeScale().fitContent();
                } else if (active && !candles.length) {
                    setError("No chart data for this symbol/interval.");
                }
            } catch (err) {
                if (active) setError(err.message || "Failed to load chart");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [symbol, interval, theme]);

    return (
        <div className="surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold">{name || symbol}</h3>
                    <p className="text-xs text-muted">{symbol}</p>
                </div>

                <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                    {INTERVALS.map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setInterval(item.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                interval === item.value
                                    ? "bg-indigo-600 text-white"
                                    : "text-muted hover:text-current"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative h-[320px] w-full">
                <div ref={containerRef} className="absolute inset-0" />
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
                        Loading chart...
                    </div>
                )}
                {error && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400 text-center px-4">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StockChart;
