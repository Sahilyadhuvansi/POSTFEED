import { useNavigate } from "react-router-dom";
import { useMusic } from "../../features/music/MusicContext";
import { Play, Eye, Music as MusicIcon, User, ExternalLink } from "lucide-react";
import { DEFAULT_AVATAR } from "../../config";

/**
 * PostCard Component for AI Chat
 * Renders a clickable post preview within the chat stream.
 */
export const PostCard = ({ post }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/post/${post.id}`)}
      className="group relative my-4 overflow-hidden rounded-3xl glass-dark border border-white/5 p-4 transition-all hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer shadow-xl animate-fade-in-up"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="h-10 w-10 rounded-xl border border-white/10 overflow-hidden">
          <img src={DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-white tracking-widest uppercase truncate">{post.username || "Anonymous"}</p>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Neural Feed</p>
        </div>
        <div className="p-2 rounded-lg glass border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3 text-white" />
        </div>
      </div>
      
      <p className="text-[11px] text-neutral-400 font-medium line-clamp-2 italic mb-4 leading-relaxed lowercase tracking-tight">
        {post.caption}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Post Entry</span>
        <div className="flex items-center gap-1.5 text-indigo-400">
            <span className="text-[9px] font-black uppercase tracking-widest">Tap to view</span>
            <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

/**
 * SongCard Component for AI Chat
 * Renders a clickable song preview with audio trigger capability.
 */
export const SongCard = ({ song }) => {
  const { playTrack } = useMusic();
  const navigate = useNavigate();

  const handlePlay = (e) => {
    e.stopPropagation();
    // In a real app, we'd fetch the full track first, 
    // but here we navigate to the music hub with the ID
    navigate(`/music?play=${song.id}`);
  };

  return (
    <div 
      onClick={() => navigate(`/music?select=${song.id}`)}
      className="group relative my-4 overflow-hidden rounded-3xl glass-dark border border-white/5 p-4 transition-all hover:bg-white/10 hover:border-pink-500/30 cursor-pointer shadow-xl animate-fade-in-up"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl glass-dark border border-white/10 flex items-center justify-center group-hover:border-pink-500/30 transition-colors">
            <MusicIcon className="w-6 h-6 text-neutral-600 group-hover:text-pink-400 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-black text-white tracking-widest uppercase truncate italic">{song.title}</h4>
          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{song.artist || "PostFeed Original"}</p>
        </div>
        <button 
            onClick={handlePlay}
            className="h-10 w-10 rounded-xl glass border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all transform active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>
      
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5 opacity-60">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Sonic Waveform</span>
        </div>
        <span className="text-[8px] font-black text-neutral-700 uppercase tracking-[0.2em]">v1.0 Controller</span>
      </div>
    </div>
  );
};

/**
 * EmptyStateCard Component
 * Displays a friendly message when no entities are found.
 */
export const EmptyStateCard = ({ message }) => (
  <div className="my-4 p-6 rounded-3xl glass border border-white/5 text-center animate-pulse">
    <div className="w-10 h-10 rounded-full glass-dark mx-auto mb-4 flex items-center justify-center">
        <User className="w-5 h-5 text-neutral-800" />
    </div>
    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">{message}</p>
  </div>
);
