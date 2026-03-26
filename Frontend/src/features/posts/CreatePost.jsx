import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import { Image, Type, Lock, Unlock, ArrowRight, X, Sparkles } from "lucide-react";
import CaptionGenerator from "../ai/CaptionGenerator";

const CreatePost = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const navigate = useNavigate();

  const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!ALLOWED_IMAGE.includes(file.type)) {
        setError("Unsupported format. Use JPG, PNG, WEBP, or GIF.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Image too large. Max 5MB.");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !caption.trim()) {
      setError("Add a caption or an image.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("caption", caption);
    formData.append("isSecret", isSecret);

    try {
      await axios.post(`${API_URL}/api/posts/create`, formData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Sharing failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-6 py-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-2xl bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">New Expression</h2>
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tight">
            Share Your 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400"> Universe</span>
          </h1>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-bold flex items-center gap-3">
             <X className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Media Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Image className="w-3 h-3" /> Captured Media
              </label>
              <span className="text-[10px] font-bold text-neutral-700 uppercase">Optional</span>
            </div>
            
            <div className="relative group">
              {imagePreview ? (
                <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
                  <img src={imagePreview} alt="" className="max-h-full max-w-full object-contain" />
                  <button 
                    type="button" 
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute top-6 right-6 p-3 bg-white text-black rounded-full hover:bg-neutral-200 transition-colors shadow-2xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-[32px] border-2 border-dashed border-white/5 bg-neutral-900/40 hover:bg-neutral-900/60 hover:border-indigo-500/30 cursor-pointer transition-all group">
                  <div className="w-16 h-16 rounded-3xl bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Image className="w-6 h-6 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Select Visual</p>
                  <p className="text-[10px] text-neutral-600 font-bold mt-1 uppercase">PNG, JPG — MAX 5MB</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Context Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                 <Type className="w-3 h-3" /> Narrative context
               </label>
               <button 
                 type="button" 
                 onClick={() => setShowAIGenerator(!showAIGenerator)}
                 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1"
               >
                 <Sparkles className="w-3 h-3" /> AI Generate
               </button>
             </div>
             
             {showAIGenerator && (
               <div className="mb-4">
                 <CaptionGenerator 
                   onCaptionGenerated={(cap, tags) => {
                     setCaption(cap + "\n\n" + tags.map(t => `#${t}`).join(" "));
                     setShowAIGenerator(false);
                   }} 
                 />
               </div>
             )}

            <textarea
              placeholder="Deep thoughts, simple moments, or silent whispers..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full h-32 bg-neutral-900/60 border border-white/5 rounded-[24px] px-6 py-5 text-sm font-medium text-white placeholder-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          {/* Security & Action */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl transition-colors ${isSecret ? "bg-pink-500/20 text-pink-500" : "bg-neutral-800 text-neutral-500"}`}>
                  {isSecret ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Ghost Mode</p>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase">Hide Identity</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSecret(!isSecret)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isSecret ? "bg-pink-500" : "bg-neutral-800"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isSecret ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!image && !caption.trim())}
              className="w-full md:w-auto px-10 py-5 bg-white text-black rounded-full text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              {loading ? "Transmitting..." : "Broadcast"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
