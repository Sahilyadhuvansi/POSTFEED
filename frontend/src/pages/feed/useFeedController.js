import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../services/api";
import { useApiCache } from "../../hooks/useApiCache";
import { useToast } from "../../components/ui/Toast";
import analytics from "../../services/analytics";

const POSTS_PER_PAGE = 12;

export const useFeedController = ({ user }) => {
  const { getFromCache, setCache } = useApiCache();
  const { addToast } = useToast();

  const observerTarget = useRef(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [likeLock, setLikeLock] = useState(new Set());

  const fetchPosts = useCallback(
    async (pageNum, isInitial = false) => {
      if (isInitial) setLoading(true);
      const cacheKey = `feed_page_${pageNum}`;
      const { data: cached } = getFromCache(cacheKey);

      if (cached && !isInitial) {
        setPosts((prev) => (pageNum === 1 ? cached : [...prev, ...cached]));
        setHasMore(cached.length === POSTS_PER_PAGE);
        return;
      }

      try {
        const res = await api.get(
          `/posts/feed?page=${pageNum}&limit=${POSTS_PER_PAGE}`,
        );
        const newPosts = res.data.posts || [];

        setPosts((prev) => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setCache(cacheKey, newPosts);

        if (isInitial) analytics.track("feed_init", { count: newPosts.length });
      } catch (err) {
        const isTimeout = err.code === "ECONNABORTED";
        addToast(
          isTimeout ? "Network sync pending..." : "Neural link failed.",
          isTimeout ? "info" : "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [getFromCache, setCache, addToast],
  );

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  }, [page, hasMore, loading, fetchPosts]);

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user) return addToast("Identity verification required.", "info");
    if (likeLock.has(postId)) return;

    setLikeLock((prev) => new Set(prev).add(postId));
    const snapshot = [...posts];

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const isLiked = p.likes?.includes(user._id);
        const nextLikes = isLiked
          ? p.likes.filter((id) => id !== user._id)
          : [...(p.likes || []), user._id];
        return { ...p, likes: nextLikes, likeCount: nextLikes.length };
      }),
    );

    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likeCount: res.data.likeCount } : p,
        ),
      );
    } catch (_err) {
      setPosts(snapshot);
      addToast("Sync failed. Reverting pulse.", "error");
    } finally {
      setLikeLock((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm("Terminate broadcast?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setCache("feed_page_1", null);
      if (selectedPost?._id === postId) setSelectedPost(null);
      addToast("Entry erased.", "success");
    } catch (_err) {
      addToast("Deletion protocol failed.", "error");
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadMore(),
      { threshold: 0.1 },
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    posts,
    selectedPost,
    setSelectedPost,
    loading,
    hasMore,
    observerTarget,
    handleLike,
    handleDelete,
  };
};
