'use client'

import { useState, useEffect, useCallback } from 'react'
import { Story } from '@/lib/stories'
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([])
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/jira/api/stories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setStories(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openStory = useCallback((index: number) => {
    setViewingIndex(index)
  }, [])

  const closeViewer = useCallback(() => {
    setViewingIndex(null)
  }, [])

  const goNext = useCallback(() => {
    if (viewingIndex === null) return
    if (viewingIndex < stories.length - 1) {
      setViewingIndex(viewingIndex + 1)
    } else {
      setViewingIndex(null)
    }
  }, [viewingIndex, stories.length])

  const goPrev = useCallback(() => {
    if (viewingIndex === null) return
    if (viewingIndex > 0) {
      setViewingIndex(viewingIndex - 1)
    }
  }, [viewingIndex])

  // Keyboard navigation
  useEffect(() => {
    if (viewingIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewingIndex, goNext, goPrev, closeViewer])

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-shrink-0 w-20 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="mt-1 h-3 bg-gray-100 rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (stories.length === 0) return null

  return (
    <>
      {/* Stories Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story, i) => (
          <button
            key={story.id}
            onClick={() => openStory(i)}
            className="flex-shrink-0 flex flex-col items-center gap-1 group"
          >
            <div className={`w-[72px] h-[72px] rounded-full p-[3px] transition-transform group-hover:scale-105 ${
              i === 0 ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-gradient-to-tr from-red-400 to-red-600'
            }`}>
              <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-gray-100">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] text-gray-600 max-w-[72px] truncate leading-tight text-center">
              {story.title}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {viewingIndex !== null && stories[viewingIndex] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                <div
                  className={`h-full bg-white rounded-full transition-all duration-300 ${
                    i < viewingIndex ? 'w-full' : i === viewingIndex ? 'w-2/3 animate-pulse' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Navigation */}
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
            disabled={viewingIndex === 0}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div
            className="relative w-full max-w-lg h-[80vh] cursor-pointer"
            onClick={goNext}
          >
            <img
              src={stories[viewingIndex].imageUrl}
              alt={stories[viewingIndex].title}
              className="w-full h-full object-contain"
            />
            {/* Title overlay */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white text-lg font-bold drop-shadow-lg">{stories[viewingIndex].title}</p>
              {stories[viewingIndex].linkUrl && (
                <a
                  href={stories[viewingIndex].linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full hover:bg-white/30 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  Saiba mais →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}