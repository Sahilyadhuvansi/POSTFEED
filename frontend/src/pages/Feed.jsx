import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { DEFAULT_AVATAR } from "../config";
import api from "../services/api";
import { PostSkeletonLoader } from "../components/SkeletonLoader";
import { useApiCache } from "../hooks/useApiCache";
import { useToast } from "../components/ui/Toast";
import { 
  MoreVertical, Trash2, Heart, MessageCircle, Share2, Eye, X, 
  LayoutGrid, Sparkles, Send, Music, Play, Pause 
} from "lucide-react";
import { useMusic } from "../features/music/MusicContext";
import { optimizeImageUrl, IMAGE_SIZES } from "../utils/image-optimization";
import analytics from "../services/analytics";

const POSTS_PER_PAGE = 12;

/**
 * PRODUCTION FEED v2.6.0
 * Deep clean, O(1) engagement, and automated pagination
 */
const Feed = () => {
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusic();
  const { getFromCache, setCache } = useApiCache();
  const { addToast } = useToast();
  
  const observerTarget = useRef(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);
  const [likeLock, setLikeLock] = useState(new Set());

  // --- CORE DATA PIPELINE ---
  
  const fetchPosts = useCallback(async (pageNum, isInitial = false) => {
    if (isInitial) setLoading(true);
    const cacheKey = `feed_page_${pageNum}`;
    const { data: cached, isStale } = getFromCache(cacheKey);

    if (cached && !isInitial) {
      setPosts(prev => pageNum === 1 ? cached : [...prev, ...cached]);
      setHasMore(cached.length === POSTS_PER_PAGE);
      return;
    }

    try {
      const res = await api.get(`/posts/feed?page=${pageNum}&limit=${POSTS_PER_PAGE}`);
      const newPosts = res.data.posts || [];
      
      setPosts(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === POSTS_PER_PAGE);
      setCache(cacheKey, newPosts);
      
      if (isInitial) analytics.track("feed_init", { count: newPosts.length });
    } catch (err) {
      const isTimeout = err.code === "ECONNABORTED";
      addToast(isTimeout ? "Network sync pending..." : "Neural link failed.", isTimeout ? "info" : "error");
    } finally {
      setLoading(false);
    }
  }, [getFromCache, setCache, addToast]);

  useEffect(() => { fetchPosts(1, true); }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  }, [page, hasMore, loading, fetchPosts]);

  // --- ATOMIC ENGAGEMENT ENGINE ---

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user) return addToast("Identity verification required.", "info");
    if (likeLock.has(postId)) return;

    setLikeLock(prev => new Set(prev).add(postId));
    const snapshot = [...posts];

    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const isLiked = p.likes?.includes(user._id);
      const nextLikes = isLiked ? p.likes.filter(id => id !== user._id) : [...(p.likes || []), user._id];
      return { ...p, likes: nextLikes, likeCount: nextLikes.length };
    }));

    try {
      const res = await api.post(`/posts/${postId}/like`);
      // Final Server Sync
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likeCount: res.data.likeCount } : p));
    } catch (err) {
      setPosts(snapshot);
      addToast("Sync failed. Reverting pulse.", "error");
    } finally {
      setLikeLock(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  };

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm("Terminate broadcast?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setCache("feed_page_1", null);
      if (selectedPost?._id === postId) setSelectedPost(null);
      addToast("Entry erased.", "success");
    } catch (err) {
      addToast("Deletion protocol failed.", "error");
    }
  };

  // --- INTERSECTION OBSERVER ---
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  if (loading && posts.length === 0) return <PostSkeletonLoader />;

  return (
    <div className="min-h-screen bg-black select-none">
      <div className="mx-auto max-w-[1400px] px-6 pt-24 pb-24">
        {/* Hub Welcome Section */}
        {user && (
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-10 gap-8">
            <div className="flex items-center gap-6">
              <div className="relative group p-1 rounded-full glass-dark border-white/5">
                <div className="h-20 w-20 rounded-full overflow-hidden border border-white/10 ring-4 ring-white/5">
                  <img src={user.profilePic || DEFAULT_AVATAR} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-black shadow-xl animate-pulse" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  Systems Online, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">{user.username}</span>
                </h1>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" /> Authorized
                  </span>
                  <span className="text-[9px] font-black text-neutral-600 tracking-[0.3em] uppercase">MF-PROD.S2</span>
                </div>
              </div>
            </div>
            <Link to="/create-post" className="btn-primary flex items-center gap-3 px-10 py-4 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest transition-all hover:bg-neutral-200 active:scale-95 shadow-2xl">
              <Send className="w-4 h-4" /> Broadcast vibe
            </Link>
          </header>
        )}

        {/* Dynamic Matrix Grid */}
        {posts.length === 0 ? (
          <section className="flex min-h-[50vh] flex-col items-center justify-center p-20 glass rounded-[60px] border-white/5 animate-fade-in">
            <LayoutGrid className="w-16 h-16 text-neutral-800 mb-6" />
            <h2 className="text-2xl font-black text-white mb-2 italic mb-8">The grid is silent.</h2>
            <Link to="/create-post" className="px-12 py-5 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">Initialize Stream</Link>
          </section>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {posts.map((post) => (
              <article 
                key={post._id} 
                className="group relative cursor-pointer overflow-hidden rounded-[40px] glass-dark aspect-square border-white/5 transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <img src={optimizeImageUrl(post.image, IMAGE_SIZES.THUMBNAIL)} alt="" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-white/[0.01] p-10 text-center">
                    <p className="text-sm text-neutral-500 font-black italic tracking-tight line-clamp-4 group-hover:text-white transition-colors capitalize">"{post.caption}"</p>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={post.user?.profilePic || DEFAULT_AVATAR} className="h-8 w-8 rounded-full border border-white/20" alt="" />
                      <span className="text-[10px] font-black text-white uppercase italic tracking-widest">@{post.user?.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => handleLike(e, post._id)} className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${post.likes?.includes(user?._id) ? "bg-pink-500 border-pink-500 text-white" : "glass border-white/10 text-white"}`}>
                        <Heart className={`w-3.5 h-3.5 ${post.likes?.includes(user?._id) ? "fill-white" : ""}`} />
                        <span className="text-[9px] font-black">{post.likeCount || 0}</span>
                       </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            
            {hasMore && (
              <div ref={observerTarget} className="col-span-full py-32 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cinematic Modal Portal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in p-4 sm:p-12" onClick={() => setSelectedPost(null)}>
          <div className="relative bg-black w-full max-w-6xl h-full sm:h-auto sm:max-h-[85vh] grid grid-cols-1 lg:grid-cols-[1.2fr_400px] gap-px overflow-hidden sm:rounded-[64px] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Close Hub */}
            <button className="absolute top-8 right-8 z-[110] p-4 glass rounded-full text-white hover:rotate-90 transition-all" onClick={() => setSelectedPost(null)}><X className="w-6 h-6" /></button>

            {/* Visual Canvas */}
            <div className="flex items-center justify-center bg-neutral-900/10">
              {selectedPost.image ? (
                <img src={selectedPost.image} alt="" className="w-full h-full object-contain sm:rounded-[50px] p-2" />
              ) : (
                <div className="p-20 text-center"><p className="text-4xl font-black text-white italic leading-tight">"{selectedPost.caption}"</p></div>
              )}
            </div>

            {/* Intel Sidebar */}
            <div className="flex flex-col h-full bg-black">
              <header className="p-10 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={selectedPost.user?.profilePic || DEFAULT_AVATAR} className="h-12 w-12 rounded-full ring-2 ring-indigo-500/20" alt="" />
                  <div>
                    <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">@{selectedPost.user?.username}</h3>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-1">Primary Feed Source</p>
                  </div>
                </div>
                {user?._id === selectedPost.user?._id && (
                  <button onClick={e => handleDelete(e, selectedPost._id)} className="p-3 rounded-2xl glass-dark border-white/5 text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-5 h-5" /></button>
                )}
              </header>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                <p className="text-sm text-neutral-400 font-medium leading-loose italic lowercase tracking-tight select-text opacity-80">{selectedPost.caption}</p>
                
                {selectedPost.youtubeUrl && (
                  <div className="p-8 rounded-[40px] glass-dark border-white/5 space-y-6">
                    <div className="flex items-center gap-3"><Music className="w-4 h-4 text-indigo-400" /> <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Atmospheric Vibe</span></div>
                    <div className="flex items-center gap-4">
                      <img src={selectedPost.youtubeThumb} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-white uppercase truncate tracking-tight">{selectedPost.youtubeTitle}</h4>
                        <button 
                          onClick={() => currentTrack?.youtubeUrl === selectedPost.youtubeUrl ? togglePlay() : playTrack({ _id: selectedPost._id + "v", title: selectedPost.youtubeTitle, youtubeUrl: selectedPost.youtubeUrl, thumbnail: selectedPost.youtubeThumb })}
                          className="mt-3 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]"
                        >
                          {isPlaying && currentTrack?.youtubeUrl === selectedPost.youtubeUrl ? <><Pause className="w-3 h-3 fill-indigo-400" /> Silence</> : <><Play className="w-3 h-3 fill-indigo-400" /> Sync Frequency</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <footer className="p-10 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-8 mb-10">
                  <button onClick={e => handleLike(e, selectedPost._id)} className={`transition-all hover:scale-110 ${selectedPost.likes?.includes(user?._id) ? "text-pink-500" : "text-neutral-500"}`}><Heart className={`w-8 h-8 ${selectedPost.likes?.includes(user?._id) ? "fill-pink-500" : ""}`} /></button>
                  <button className="text-neutral-500 hover:text-white transition-all hover:scale-110"><MessageCircle className="w-8 h-8" /></button>
                  <button className="text-neutral-500 hover:text-white transition-all hover:scale-110"><Share2 className="w-8 h-8" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl glass text-center border-white/5">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Pulse Count</p>
                    <p className="text-xl font-black text-white">{selectedPost.likeCount || 0}</p>
                  </div>
                  <div className="p-5 rounded-3xl glass text-center border-white/5">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Global Views</p>
                    <p className="text-xl font-black text-white">{(selectedPost.viewCount || 0) + 1}</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
