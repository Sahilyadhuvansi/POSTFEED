import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, DEFAULT_AVATAR } from "../../config";
import { useToast } from "../../components/ui/Toast";
import { X, Heart, MessageCircle, Share2, User, Calendar } from "lucide-react";

/**
 * PostDetail Component
 * Provides a dedicated, high-focus view for a specific post.
 * Integrated with the AI Assistant for deep-link navigation.
 */
const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${postId}`);
        setPost(res.data.data || res.data); // Support both formats
      } catch (err) {
        addToast(
          err.response?.data?.error ||
            "Failed to retrieve post. It may have been deleted.",
          "error",
        );
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, addToast, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <div className="mx-auto max-w-[1400px] px-6 pt-24 pb-24">
        {/* Navigation Breadcrumb */}
        <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-neutral-500 hover:text-white transition-all group"
          >
            <X className="w-5 h-5 group-hover:-rotate-90 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              Return to stream
            </span>
          </button>
          <div className="hidden md:flex items-center gap-4 px-6 py-2 glass rounded-full border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Deep Link Verified
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-12 bg-neutral-900/20 rounded-[48px] border border-white/5 overflow-hidden p-4 lg:p-8 shadow-2xl">
          {/* Visual Focus Column */}
          <div className="relative group rounded-[40px] overflow-hidden bg-neutral-900 border border-white/10 aspect-video lg:aspect-auto flex items-center justify-center min-h-[400px]">
            {post.image ? (
              <img
                src={post.image}
                alt=""
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="p-12 text-center max-w-xl">
                <p className="text-3xl font-black italic leading-tight tracking-tighter opacity-80 decoration-indigo-500/30 underline underline-offset-8">
                  "{post.caption}"
                </p>
              </div>
            )}

            {/* Context Badge */}
            <div className="absolute bottom-8 left-8">
              <div className="glass px-6 py-3 rounded-2xl border-white/10 backdrop-blur-3xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  Published {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Intel & Engagement Column */}
          <div className="flex flex-col h-full space-y-8">
            {/* Author Cluster */}
            <div className="p-8 glass rounded-[32px] border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl border-2 border-indigo-500/30 p-0.5 overflow-hidden">
                  <img
                    src={post.user?.profilePic || DEFAULT_AVATAR}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter italic uppercase text-white">
                    @{post.user?.username || "Identity Unknown"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-neutral-600" />
                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">
                      Logged: {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <button className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white text-white hover:text-black transition-all">
                <User className="w-5 h-5" />
              </button>
            </div>

            {/* Expression Data */}
            <div className="flex-1 p-8 glass rounded-[32px] border-white/5 min-h-[200px]">
              <p className="text-sm font-medium leading-relaxed text-neutral-300 italic first-letter:text-4xl first-letter:font-black first-letter:mr-2">
                {post.caption}
              </p>
            </div>

            {/* Interaction */}
            <div className="p-10 glass-dark rounded-[32px] border-white/10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <button className="text-neutral-500 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                      <Heart className="w-7 h-7" />
                    </button>
                    <button className="text-neutral-500 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                      <MessageCircle className="w-7 h-7" />
                    </button>
                    <button className="text-neutral-500 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                      <Share2 className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Heart className="w-32 h-32 text-indigo-500 rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

