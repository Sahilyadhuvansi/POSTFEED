import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Trash2 } from "lucide-react";

/**
 * Premium Floating AI Assistant (Tailwind Refactored)
 * 
 * Re-imagined with high-end glassmorphism and smooth animations
 * integrated with the project's dark theme.
 */
const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/ai/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
              { role: "user", content: inputValue },
            ],
            options: { temperature: 0.7, maxTokens: 1024 },
          }),
        }
      );

      if (!response.ok) throw new Error("Connection failed. Try again.");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.content, model: data.model },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-600 p-0 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/40 active:scale-95"
        >
          {/* Animated Background Pulse */}
          <span className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 opacity-100 transition-opacity group-hover:opacity-90"></span>
          <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-20"></span>
          
          <Sparkles className="relative z-10 h-8 w-8 transition-transform group-hover:rotate-12" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="flex w-[380px] origin-bottom-right animate-in fade-in slide-in-from-bottom-5 duration-300 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 sm:w-[420px]">
          
          {/* Dynamic Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900/40 to-black p-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white">AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">Groq-LPU-Active</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="group flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X size={18} className="transition-transform group-hover:scale-110" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex h-[450px] flex-col gap-4 overflow-y-auto bg-zinc-950 p-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center space-y-3 opacity-40">
                <div className="rounded-full bg-zinc-900 p-4">
                  <Sparkles size={32} className="text-zinc-600" />
                </div>
                <p className="text-[13px] text-center font-medium">Hello! How can I help with<br/>your music experience today?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in zoom-in-95 duration-200`}
              >
                <div
                  className={`max-w-[85%] rounded-[20px] px-4 py-3 leading-relaxed text-[14px] shadow-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex space-x-1.5 bg-zinc-900/50 rounded-2xl px-4 py-3 border border-zinc-800/50">
                  <div className="h-1.5 w-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-zinc-600 rounded-full animate-bounce delay-100"></div>
                  <div className="h-1.5 w-1.5 bg-zinc-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-medium">
                  {error}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Precision Input Area */}
          <div className="bg-zinc-950 p-4 border-t border-zinc-900 group">
            <form onSubmit={handleSendMessage} className="relative flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full rounded-2xl bg-zinc-900 border-zinc-800 px-5 py-3.5 pr-14 text-[14px] text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 transition-all focus:ring-2 focus:ring-indigo-500/50"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 top-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-30"
              >
                <Send size={18} />
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between px-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-wider"
                >
                  <Trash2 size={12} />
                  Clear Session
                </button>
              )}
              <p className="ml-auto text-[10px] text-zinc-600 font-medium">✨ Responses powered by Llama 3</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingAIButton;
