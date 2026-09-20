import { memo, useEffect, useRef, useState } from "react";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import { sendChatMessage } from "../services/chatService";

const SUGGESTIONS = [
    "What's my total P&L?",
    "How much cash do I have?",
    "What is Reliance trading at?",
    "List my holdings",
];

function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "bot",
            text: "Hi! I'm your TradePro assistant. Ask me about your holdings, P&L, cash, or a stock price.",
        },
    ]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const send = async (text) => {
        const message = (text ?? input).trim();
        if (!message || busy) return;
        setInput("");
        setMessages((m) => [...m, { role: "user", text: message }]);
        setBusy(true);
        try {
            const { reply } = await sendChatMessage(message);
            setMessages((m) => [...m, { role: "bot", text: reply }]);
        } catch {
            setMessages((m) => [
                ...m,
                { role: "bot", text: "Sorry, I couldn't reach the assistant right now." },
            ]);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            {/* Floating toggle */}
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Open AI assistant"
                className="fixed bottom-6 right-6 z-200 h-14 w-14 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-105 transition"
            >
                {open ? <FaTimes size={20} /> : <FaRobot size={22} />}
            </button>

            {open && (
                <div className="fixed bottom-24 right-6 z-200 w-[92vw] max-w-sm h-[70vh] max-h-140 surface rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white">
                        <FaRobot />
                        <div>
                            <p className="font-semibold text-sm leading-tight">TradePro Assistant</p>
                            <p className="text-[11px] opacity-80">Portfolio & market Q&amp;A</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                                        m.role === "user"
                                            ? "bg-indigo-600 text-white rounded-br-sm"
                                            : "bg-white/10 rounded-bl-sm"
                                    }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {busy && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 rounded-2xl px-3.5 py-2 text-sm text-muted">
                                    Thinking…
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {messages.length <= 1 && (
                        <div className="px-3 pb-2 flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-muted"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                        className="p-3 border-t border-white/10 flex items-center gap-2"
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your portfolio…"
                            className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50"
                        >
                            <FaPaperPlane size={14} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

export default memo(ChatBot);
