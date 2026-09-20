import { memo, useEffect, useRef, useState } from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import { searchStocks } from "../services/watchlistService";
import { useDebounce } from "../hooks/useDebounce";

// Debounced stock search dropdown. onPick(stock) is called when a result is
// selected/added. Memoized to avoid re-rendering with the parent.
function StockSearch({ onPick }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const debounced = useDebounce(query, 250);
    const boxRef = useRef(null);

    useEffect(() => {
        let active = true;
        if (!debounced.trim()) {
            setResults([]);
            return;
        }
        searchStocks(debounced, 8)
            .then((r) => active && setResults(r))
            .catch(() => active && setResults([]));
        return () => {
            active = false;
        };
    }, [debounced]);

    useEffect(() => {
        const onClick = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const pick = (stock) => {
        onPick?.(stock);
        setQuery("");
        setResults([]);
        setOpen(false);
    };

    return (
        <div ref={boxRef} className="relative w-full max-w-sm">
            <div className="flex items-center surface rounded-xl px-4 py-2">
                <FaSearch className="text-muted mr-3" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search stocks (e.g. RELIANCE)..."
                    className="bg-transparent outline-none w-full text-sm"
                />
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-2 w-full surface-solid text-(--text) rounded-xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto border border-(--border)">
                    {results.map((s) => (
                        <button
                            key={s.symbol}
                            onClick={() => pick(s)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover-surface text-left"
                        >
                            <div>
                                <p className="text-sm font-medium">{s.name}</p>
                                <p className="text-xs text-muted">{s.symbol}</p>
                            </div>
                            <FaPlus className="text-indigo-400" size={12} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default memo(StockSearch);
