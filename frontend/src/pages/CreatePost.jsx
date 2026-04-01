import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ui/Toast";
import {
  Image,
  Type,
  Lock,
  Unlock,
  ArrowRight,
  X,
  Sparkles,
  Music,
  Search,
  Play,
  Pause,
} from "lucide-react";
import CaptionGenerator from "../features/ai/CaptionGenerator";
import { useMusic } from "../features/music/MusicContext";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const CreatePost = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [musicSearch, setMusicSearch] = useState("");
  const [musicResults, setMusicResults] = useState([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [attachedTrack, setAttachedTrack] = useState(null);
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusic();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleMusicSearch = async (e) => {
    e.preventDefault();
    if (!musicSearch.trim()) return;
    setIsSearchingMusic(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(musicSearch)}&type=video&key=${API_KEY}`,
      );
      const data = await response.json();
      const tracks = data.items.map((item) => ({
        _id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        artist: { username: item.snippet.channelTitle },
      }));
      setMusicResults(tracks);
    } catch {
      addToast("Search failed. Check your API key.", "error");
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!ALLOWED_IMAGE.includes(file.type)) {
        addToast("Unsupported format. Use JPG, PNG, WEBP, or GIF.", "error");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        addToast("Image too large. Max 5MB.", "error");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !caption.trim()) {
      addToast("Add a caption or an image to share your universe.", "info");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("caption", caption);
    formData.append("isSecret", isSecret);
    if (attachedTrack) {
      formData.append("youtubeUrl", attachedTrack.youtubeUrl);
      formData.append("youtubeTitle", attachedTrack.title);
      formData.append("youtubeThumb", attachedTrack.thumbnail);
    }

    try {
      await api.post("/posts/create", formData);
      addToast("Your expression has been broadcasted.", "success");
      navigate("/");
    } catch (err) {
      addToast(
        err.response?.data?.error || "Sharing failed. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] bg-indigo-600/5 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[40rem] h-[40rem] bg-pink-600/5 rounded-full blur-[160px] animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-2xl glass rounded-[40px] p-8 md:p-12 shadow-[0_32px_128px_rgba(0,0,0,0.8)] border-white/5">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
              New Expression
            </h2>
          </div>
          <h1 className="text-4xl font-black italic tracking-tight text-white">
            Share Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              {" "}
              Universe
            </span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Media Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] flex items-center gap-2">
                <Image className="w-3 h-3" /> Captured Media
              </label>
              <span className="text-[10px] font-bold text-neutral-700 uppercase">
                Optional
              </span>
            </div>

            <div className="relative group">
              {imagePreview ? (
                <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-6 right-6 p-3 bg-white text-black rounded-full hover:bg-neutral-200 transition-all shadow-2xl active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-[32px] border-2 border-dashed border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer transition-all group">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Image className="w-6 h-6 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">
                    Select Visual
                  </p>
                  <p className="text-[10px] text-neutral-600 font-bold mt-1 uppercase">
                    PNG, JPG — MAX 5MB
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Context Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] flex items-center gap-2">
                <Type className="w-3 h-3" /> Narrative context
              </label>
              <button
                type="button"
                onClick={() => setShowAIGenerator(!showAIGenerator)}
                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> AI Generate
              </button>
            </div>

            {showAIGenerator && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <CaptionGenerator
                  onCaptionGenerated={(cap, tags) => {
                    setCaption(
                      cap + "\n\n" + tags.map((t) => `#${t}`).join(" "),
                    );
                    setShowAIGenerator(false);
                    addToast("AI Narrative infused.", "info");
                  }}
                />
              </div>
            )}

            <textarea
              placeholder="Deep thoughts, simple moments, or silent whispers..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full h-32 bg-white/5 border border-white/5 rounded-[24px] px-6 py-5 text-sm font-medium text-white placeholder-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-all resize-none hover:bg-white/[0.07]"
            />
          </div>

          {/* Music Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] flex items-center gap-2">
                <Music className="w-3 h-3" /> Musical Resonance
              </label>
              {attachedTrack && (
                <button
                  type="button"
                  onClick={() => setAttachedTrack(null)}
                  className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:text-pink-400 transition-colors"
                >
                  Remove vibe
                </button>
              )}
            </div>

            {attachedTrack ? (
              <div className="relative group p-4 rounded-[28px] border border-white/5 bg-white/5 flex items-center gap-4">
                <img
                  src={attachedTrack.thumbnail}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-white truncate uppercase tracking-tighter italic">
                    {attachedTrack.title}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">
                    {attachedTrack.artist?.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentTrack?.youtubeUrl === attachedTrack.youtubeUrl) {
                      togglePlay();
                    } else {
                      playTrack(attachedTrack);
                    }
                  }}
                  className="p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all shadow-xl"
                >
                  {isPlaying &&
                  currentTrack?.youtubeUrl === attachedTrack.youtubeUrl ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for the perfect vibe on YouTube..."
                    value={musicSearch}
                    onChange={(e) => setMusicSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMusicSearch(e)}
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] pl-12 pr-6 py-4 text-sm font-medium text-white placeholder-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <button
                    type="button"
                    onClick={handleMusicSearch}
                    disabled={isSearchingMusic || !musicSearch.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 px-4 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSearchingMusic ? "Searching..." : "Find"}
                  </button>
                </div>

                {musicResults.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {musicResults.map((track) => (
                      <div
                        key={track._id}
                        onClick={() => setAttachedTrack(track)}
                        className="p-3 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 cursor-pointer flex items-center gap-4 transition-all group"
                      >
                        <img
                          src={track.thumbnail}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[9px] text-neutral-600 font-bold uppercase mt-0.5">
                            {track.artist?.username}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-neutral-800 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security & Action */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-4 rounded-[20px] transition-all duration-300 ${isSecret ? "bg-pink-500/20 text-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.2)]" : "bg-white/5 text-neutral-600"}`}
                >
                  {isSecret ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Unlock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">
                    Ghost Mode
                  </p>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase">
                    Hide Identity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSecret(!isSecret)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isSecret ? "bg-pink-500" : "bg-neutral-800"}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${isSecret ? "translate-x-8" : "translate-x-1"}`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!image && !caption.trim())}
              className="w-full md:w-auto px-12 py-5 bg-white text-black rounded-full text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
            >
              {loading ? "Transmitting..." : "Broadcast"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
