import { useState, useCallback } from 'react'
import { Loader, Laugh, Copy, Check } from 'lucide-react'

interface Joke {
  type: 'single' | 'twopart'
  joke?: string
  setup?: string
  delivery?: string
  category: string
}

export default function JokeGenerator() {
  const [joke, setJoke] = useState<Joke | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [category, setCategory] = useState('any')

  const categories = ['any', 'general', 'programming', 'knock-knock']

  const fetchJoke = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCopied(false)

    try {
      const url =
        category === 'any'
          ? 'https://v2.jokeapi.dev/joke/Any'
          : `https://v2.jokeapi.dev/joke/${
              category.charAt(0).toUpperCase() + category.slice(1)
            }`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch joke')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error('No joke found for this category')
      }

      setJoke({
        type: data.type,
        joke: data.joke,
        setup: data.setup,
        delivery: data.delivery,
        category: data.category,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setJoke(null)
    } finally {
      setLoading(false)
    }
  }, [category])

  const copyToClipboard = () => {
    if (!joke) return

    const jokeText =
      joke.type === 'single'
        ? joke.joke
        : `${joke.setup}\n${joke.delivery}`

    navigator.clipboard.writeText(jokeText || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Laugh className="w-12 h-12 text-yellow-300" />
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
              Joke Generator
            </h1>
            <Laugh className="w-12 h-12 text-yellow-300" />
          </div>
          <p className="text-white text-lg opacity-90">
            Brighten your day with a random joke! 🎉
          </p>
        </div>

        {/* Category Selection */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 mb-6 shadow-xl">
          <label className="block text-white mb-3 font-semibold">
            Select Category:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  category === cat
                    ? 'bg-white text-purple-600 shadow-lg scale-105'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Button */}
        <button
          onClick={fetchJoke}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-300 to-orange-400 hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold py-4 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3 mb-6"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Getting a joke...</span>
            </>
          ) : (
            <>
              <Laugh className="w-5 h-5" />
              <span>Generate Joke</span>
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-4 rounded-lg mb-6 shadow-lg">
            <p className="font-semibold">❌ Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Joke Display */}
        {joke && (
          <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-lg p-8 shadow-2xl">
            <div className="mb-4">
              <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {joke.category}
              </span>
            </div>

            {joke.type === 'single' ? (
              <p className="text-xl text-gray-800 leading-relaxed mb-6">
                {joke.joke}
              </p>
            ) : (
              <div>
                <p className="text-xl text-gray-800 leading-relaxed mb-4">
                  <span className="font-semibold">Setup:</span> {joke.setup}
                </p>
                <p className="text-xl text-gray-600 leading-relaxed mb-6 italic">
                  <span className="font-semibold">Punchline:</span> {joke.delivery}
                </p>
              </div>
            )}

            {/* Copy Button */}
            <button
              onClick={copyToClipboard}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Joke</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Welcome Message */}
        {!joke && !loading && !error && (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 text-center shadow-xl">
            <p className="text-white text-lg">
              👆 Click "Generate Joke" to get started!
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white text-opacity-70">
          <p className="text-sm">
            Powered by{' '}
            <a
              href="https://jokeapi.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-opacity-100 transition-opacity"
            >
              JokeAPI
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
