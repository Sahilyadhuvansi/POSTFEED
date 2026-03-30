import { useState, useRef, useEffect } from "react";
<<<<<<< HEAD
import { X, Send, Sparkles, Trash2 } from "lucide-react";

/**
 * Premium Floating AI Assistant (Tailwind Refactored)
 * 
 * Re-imagined with high-end glassmorphism and smooth animations
 * integrated with the project's dark theme.
=======
import { X, Send } from "lucide-react";
import { api } from "../config";
import { PostCard, SongCard, EmptyStateCard } from "./ui/AIChatCards";
import "../styles/FloatingAIButton.css";

/**
 * Floating AI Chat Button Component
 * 
 * Features:
 * - Fixed position in bottom-right corner
 * - Minimal circular FAB design
 * - Groq-powered backend integration
 * - Clean chat interface (no Claude/Anthropic branding)
>>>>>>> main
 */
const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

<<<<<<< HEAD
  // Auto-scroll to latest message
=======
  // Scroll to bottom when messages update
>>>>>>> main
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

<<<<<<< HEAD
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), role: "user", content: inputValue };
=======
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Add user message to chat state immediately for UI responsiveness
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: inputValue,
    };

>>>>>>> main
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
<<<<<<< HEAD
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
=======
      // Use centralized axios instance for consistent headers and error handling
      const { data } = await api.post("/ai/chat", {
        messages: [
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: inputValue },
        ],
        options: {
          temperature: 0.7,
          maxTokens: 512, // Reduced for faster response
        },
      });

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        type: data.type || "text",
        payload: data.payload || null,
        content: data.content || "",
        model: data.model,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "AI assistant is taking a break. Try shorter messages.";
      setError(errorMsg);
      console.error("Chat error:", err);
>>>>>>> main
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <>
      {/* Floating Circular Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="floating-fab"
          title="Open AI Assistant"
          aria-label="Open AI Assistant"
        >
          <svg
            className="fab-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {/* Sparkle/Star Icon */}
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
>>>>>>> main
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
<<<<<<< HEAD
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
=======
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="header-content">
              <h3>AI Assistant</h3>
              <p className="text-xs">Powered by Groq</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="close-button"
              aria-label="Close AI Assistant"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="sparkle">✨</div>
                <h4>Welcome!</h4>
                <p>Ask me anything. I'm here to help!</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message message-${message.role}`}
              >
                <div className="message-bubble">
                  {message.role === "assistant" && message.type === "ui-controller" ? (
                    <div className="structured-content">
                      {message.payload?.type === "posts" && message.payload.data?.map(post => (
                        <PostCard key={post.id} post={post} />
                      ))}
                      {message.payload?.type === "songs" && message.payload.data?.map(song => (
                        <SongCard key={song.id} song={song} />
                      ))}
                      {message.payload?.type === "empty" && (
                        <EmptyStateCard message={message.payload.message} />
                      )}
                      {/* Fallback for unknown UI types */}
                      {!["posts", "songs", "empty"].includes(message.payload?.type) && (
                         <p>{message.content || "Data received, but I can't render it yet."}</p>
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
>>>>>>> main
                </div>
              </div>
            ))}

            {isLoading && (
<<<<<<< HEAD
              <div className="flex justify-start animate-pulse">
                <div className="flex space-x-1.5 bg-zinc-900/50 rounded-2xl px-4 py-3 border border-zinc-800/50">
                  <div className="h-1.5 w-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-zinc-600 rounded-full animate-bounce delay-100"></div>
                  <div className="h-1.5 w-1.5 bg-zinc-600 rounded-full animate-bounce delay-200"></div>
=======
              <div className="message message-assistant">
                <div className="message-bubble loading">
                  <span></span>
                  <span></span>
                  <span></span>
>>>>>>> main
                </div>
              </div>
            )}

            {error && (
<<<<<<< HEAD
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
=======
              <div className="message message-error">
                <div className="message-bubble">
                  ⚠️ {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-form">
>>>>>>> main
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
<<<<<<< HEAD
                placeholder="Ask anything..."
                className="w-full rounded-2xl bg-zinc-900 border-zinc-800 px-5 py-3.5 pr-14 text-[14px] text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 transition-all focus:ring-2 focus:ring-indigo-500/50"
=======
                placeholder="Type your message..."
                className="chat-input"
>>>>>>> main
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
<<<<<<< HEAD
                className="absolute right-2 top-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-30"
=======
                className="send-button"
                aria-label="Send message"
>>>>>>> main
              >
                <Send size={18} />
              </button>
            </form>

<<<<<<< HEAD
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
=======
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="clear-button"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </>
>>>>>>> main
  );
};

export default FloatingAIButton;
