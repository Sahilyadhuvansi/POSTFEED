import { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function CaptionGenerator({ onCaptionGenerated }) {
  const [context, setContext] = useState('')
  const [musicTitle, setMusicTitle] = useState('')
  const [mood, setMood] = useState('')
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState([])
  const [copied, setCopied] = useState(false)

  const generateCaption = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}/api/ai/generate-caption`,
        { context, musicTitle, mood },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setCaption(response.data.data.caption)
        await generateHashtags(response.data.data.caption)
      }
    } catch (error) {
      console.error('Failed to generate caption:', error)
      alert('Failed to generate caption. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateHashtags = async (captionText) => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}/api/ai/suggest-hashtags`,
        { caption: captionText, musicTitle, genre: mood },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setHashtags(response.data.data.hashtags)
      }
    } catch (error) {
      console.error('Failed to generate hashtags:', error)
    }
  }

  const copyToClipboard = () => {
    const fullText = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    if (onCaptionGenerated) {
      onCaptionGenerated(caption, hashtags)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">AI Caption Generator</h3>
      </div>

      {/* Input Fields */}
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Music Title
          </label>
          <input
            type="text"
            value={musicTitle}
            onChange={(e) => setMusicTitle(e.target.value)}
            placeholder="Enter your music title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Context (optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What's this music about? Any special story?"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mood
          </label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select mood...</option>
            <option value="chill">Chill</option>
            <option value="energetic">Energetic</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="focus">Focus</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateCaption}
        disabled={loading || !musicTitle.trim()}
        className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Caption
          </>
        )}
      </button>

      {/* Generated Caption */}
      {caption && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <p className="font-medium text-purple-900">Generated Caption:</p>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="text-gray-800 mb-3">{caption}</p>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
