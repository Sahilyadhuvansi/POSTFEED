import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Music, TrendingUp } from 'lucide-react'
import { useApiCache } from '../../hooks/useApiCache'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Recommendations() {
  const { getFromCache, setCache } = useApiCache()
  const cacheKey = `recommendations_${mood}`
  const initialCached = getFromCache(cacheKey)

  const [recommendations, setRecommendations] = useState(initialCached || [])
  const [loading, setLoading] = useState(!initialCached)
  const [mood, setMood] = useState('')

  const fetchRecommendations = useCallback(async () => {
    // Skip fetch if we have cached data
    const cached = getFromCache(cacheKey)
    if (cached) {
      setRecommendations(cached)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_URL}/api/ai/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, mood: mood || undefined }
      })

      if (response.data.success) {
        setRecommendations(response.data.data)
        setCache(cacheKey, response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }, [mood])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const moods = ['chill', 'energetic', 'focus', 'happy', 'sad']

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h1 className="text-3xl font-bold">AI Recommendations</h1>
        </div>
        <p className="text-gray-600">
          Personalized music picks just for you
        </p>
      </div>

      {/* Mood Filter */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">Filter by mood:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMood('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              mood === ''
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                mood === m
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No recommendations found. Try uploading some music first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((music) => (
            <div
              key={music._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Music Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{music.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {music.userId?.username || 'Unknown'}
                  </p>
                  
                  {music.recommendationReason && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block">
                      <Sparkles className="w-4 h-4" />
                      {music.recommendationReason}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>👍 {music.likes || 0} likes</span>
                    <span>▶️ {music.plays || 0} plays</span>
                    {music.genre && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {music.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Play Button */}
                <button className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-medium transition-colors">
                  Play
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
