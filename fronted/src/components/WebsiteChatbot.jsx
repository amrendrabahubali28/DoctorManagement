import React, { useEffect, useRef, useState } from "react";
import { Bot, HelpCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";

const STARTER = {
  role: "assistant",
  text:
    "Hi, I can help you find the right doctor. Tell me your symptoms, what kind of specialist you need, or ask about fees, slots, or availability.",
};

const QUICK_QUESTIONS = [
  "I have had a fever for 3 days",
  "My child has a skin rash",
  "I need a cheap general physician",
  "Who can I see for a bad headache?",
];

const MAX_HISTORY = 15; // sent to backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function WebsiteChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([STARTER]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

  const buildHistory = (allMessages) => {
    // Drop the starter greeting so the model doesn't see itself as the first turn.
    const real = allMessages
      .filter((m) => !m.isStarter)
      .map((m) => ({ role: m.role, content: m.text }));
    return real.slice(-MAX_HISTORY);
  };

  const sendMessage = async (text = input) => {
    const question = text.trim();
    if (!question || loading) return;

    const userMsg = { role: "user", text: question };
    const history = buildHistory(messages); // BEFORE pushing the new user msg

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setOpen(true);
    setLoading(true);

    try {
      if (!BACKEND_URL) {
        throw new Error("VITE_BACKEND_URL is not configured.");
      }

      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          doctors: Array.isArray(data.doctors) ? data.doctors : [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            err?.message ||
            "Sorry, I couldn't reach the assistant. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {open && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Doctor Assistant</p>
                <p className="text-xs text-slate-300">Find the right doctor</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10"
              title="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 ${
                      m.role === "user"
                        ? "rounded-tr-md bg-indigo-600 text-white"
                        : m.isError
                        ? "rounded-tl-md bg-rose-50 text-rose-700"
                        : "rounded-tl-md bg-slate-100 text-slate-700"
                    }`}
                  >
                    {m.text}

                    {Array.isArray(m.doctors) && m.doctors.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600">
                        <p className="font-semibold text-slate-700">
                          Matched doctors
                        </p>
                        {m.doctors.slice(0, 5).map((d) => (
                          <p key={d._id} className="truncate">
                            •{" "}
                            {d.summary?.split("\n")[0]?.replace(/^Name:\s*/i, "") ||
                              d._id}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    Thinking…
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms or ask a question…"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <div className="mb-3 hidden max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg sm:block">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span>Need help finding a doctor?</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((p) => !p)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        title="Open doctor assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {!open && (
        <div className="pointer-events-none absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}