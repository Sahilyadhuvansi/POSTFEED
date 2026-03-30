import { useState } from "react";
import { Sparkles, Copy, Check, Type, Music, Zap, Brain, Wand2, Hash } from "lucide-react";
import { api } from "../../config";
import { useToast } from "../../components/ui/Toast";

const NeuralNarrator = ({ onCaptionGenerated }) => {
  const [context, setContext] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const generateCaption = async () => {
    try {
      setLoading(true);
      const response = await api.post(
        "/ai/generate-caption",
        { context, musicTitle, mood }
      );

      if (response.data.success) {
        setCaption(response.data.data.caption);
        await generateHashtags(response.data.data.caption);
        addToast("Narrative sequence generated.", "success");
      }
    } catch (error) {
      addToast(error.response?.data?.error || "Generation error. Nexus link unstable.", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateHashtags = async (captionText) => {
    try {
      const response = await api.post(
        "/ai/suggest-hashtags",
        { caption: captionText, musicTitle, genre: mood }
      );

      if (response.data.success) {
        setHashtags(response.data.data.hashtags);
      }
    } catch (error) {
      console.error("Frequency analysis failed:", error);
    }
  };

  const copyToClipboard = () => {
    const fullText = `${caption}\n\n${hashtags.map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (onCaptionGenerated) {
      onCaptionGenerated(caption, hashtags);
    }
    addToast("Data copied to broadcast buffer.", "info");
  };

  return (
    <div className="glass-dark border border-white/5 rounded-[32px] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl glass border-white/10 text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tight">Neural Narrator</h3>
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mt-0.5">AI-Powered Context Generation</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-75" />
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-150" />
        </div>
      </div>

      {/* Logic Fields */}
      <div className="space-y-6 mb-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Music className="w-3 h-3" /> Sonic Identity
          </label>
          <input
            type="text"
            value={musicTitle}
            onChange={(e) => setMusicTitle(e.target.value)}
            placeholder="Track Title or Focus..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-indigo-500/50 transition-all hover:bg-white/[0.07]"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Type className="w-3 h-3" /> Core Narrative
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What's this music about? Infuse your story..."
            rows={3}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-indigo-500/50 transition-all hover:bg-white/[0.07] resize-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Emotional Frequency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["chill", "energetic", "focus", "happy", "sad", "lo-fi"].map((m) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${mood === m ? "bg-indigo-500 border-indigo-500 text-white shadow-lg mx-scale-105" : "glass border-white/5 text-neutral-500 hover:bg-white/5 hover:text-white"}`}
                >
                    {m}
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Point */}
      <button
        onClick={generateCaption}
        disabled={loading || !musicTitle.trim()}
        className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${loading ? "bg-white/10 text-neutral-500 cursor-not-allowed" : "bg-white text-black hover:bg-neutral-200"}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Neural Synthesis...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Infuse Narrative
          </>
        )}
      </button>

      {/* Synthetic Output */}
      {caption && (
        <div className="mt-10 p-6 glass rounded-[24px] border border-indigo-500/20 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Neural Proposal</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Captured
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Extract
                </>
              )}
            </button>
          </div>

          <p className="text-sm font-medium text-neutral-300 leading-relaxed italic mb-6">"{caption}"</p>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 lowercase tracking-tight"
                >
                  <Hash className="w-2.5 h-2.5 opacity-50" />
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NeuralNarrator;
