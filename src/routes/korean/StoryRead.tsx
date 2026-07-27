import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Home } from 'lucide-react'
import { stories } from '@/data/stories'
import { useSpeech } from '@/hooks/useSpeech'
import { useSettingsStore } from '@/stores/settingsStore'

export default function StoryRead() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { soundEnabled } = useSettingsStore()
  const { speak } = useSpeech()

  const story = stories.find((s) => s.id === id)
  const [pageIndex, setPageIndex] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [highlightWord, setHighlightWord] = useState<number | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!story) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-500">동화를 찾을 수 없어요</p>
      </div>
    )
  }

  const page = story.pages[pageIndex]
  const words = page.text.split(' ')
  const isLastPage = pageIndex === story.pages.length - 1

  // 페이지 읽기
  const readPage = () => {
    if (!soundEnabled) return
    setIsReading(true)
    setHighlightWord(0)

    // 단어별 하이라이트 타이밍 (약 글자수 기반)
    let delay = 0
    const totalChars = words.reduce((sum, w) => sum + w.length, 0)
    const totalDuration = Math.max(2000, totalChars * 120) // 글자당 120ms

    words.forEach((word, i) => {
      const wordDuration = (word.length / totalChars) * totalDuration
      readTimer.current = setTimeout(() => {
        setHighlightWord(i)
      }, delay)
      delay += wordDuration
    })

    // 전체 문장 TTS
    speak(page.text, 'ko-KR')

    // 읽기 완료 후 상태 초기화
    readTimer.current = setTimeout(() => {
      setIsReading(false)
      setHighlightWord(null)
    }, delay + 300)
  }

  // 자동 읽기 (페이지 넘길 때)
  useEffect(() => {
    if (soundEnabled) {
      const t = setTimeout(readPage, 500)
      return () => clearTimeout(t)
    }
  }, [pageIndex])

  // cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (readTimer.current) clearTimeout(readTimer.current)
    }
  }, [])

  const nextPage = () => {
    if (isLastPage) {
      setShowComplete(true)
    } else {
      window.speechSynthesis.cancel()
      setIsReading(false)
      setHighlightWord(null)
      setPageIndex((p) => p + 1)
    }
  }

  const prevPage = () => {
    if (pageIndex > 0) {
      window.speechSynthesis.cancel()
      setIsReading(false)
      setHighlightWord(null)
      setPageIndex((p) => p - 1)
    }
  }

  const speakWord = (word: string) => {
    speak(word, 'ko-KR')
  }

  const restart = () => {
    setPageIndex(0)
    setShowComplete(false)
    setIsReading(false)
    setHighlightWord(null)
  }

  if (showComplete) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex items-center justify-center p-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full"
        >
          <div className="text-6xl mb-4">📖✨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">다 읽었어요!</h2>
          <p className="text-gray-500 mb-6">"{story.title}" 잘 읽었어요!</p>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 transition-colors"
            >
              <RotateCcw size={18} /> 다시 읽기
            </button>
            <button
              onClick={() => navigate('/korean/story')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
            >
              <Home size={18} /> 목록으로
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/korean/story" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[15px] font-bold text-gray-900 truncate max-w-[200px]">{story.title}</h1>
          <span className="text-xs text-gray-400 font-medium">
            {pageIndex + 1}/{story.pages.length}
          </span>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* 삽화 */}
            <div className="text-center mb-6">
              {page.image ? (
                <img
                  src={import.meta.env.BASE_URL + page.image}
                  alt=""
                  className="mx-auto rounded-2xl shadow-md w-full max-w-[380px]"
                />
              ) : (
                <span className="text-7xl leading-none">{page.emoji}</span>
              )}
            </div>

            {/* 문장 (단어별 터치 가능) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 min-h-[120px] flex items-center justify-center">
              <p className="text-center leading-relaxed flex flex-wrap justify-center gap-x-2 gap-y-1">
                {words.map((word, i) => (
                  <motion.span
                    key={i}
                    onClick={() => speakWord(word)}
                    className={`text-2xl font-medium cursor-pointer rounded-lg px-1 py-0.5 transition-colors ${
                      highlightWord === i
                        ? 'bg-amber-200 text-amber-900'
                        : 'text-gray-800 hover:bg-amber-50 active:bg-amber-100'
                    }`}
                    animate={highlightWord === i ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 하단 컨트롤 */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 py-4">
        <div className="max-w-lg mx-auto px-5 flex items-center justify-between">
          <button
            onClick={prevPage}
            disabled={pageIndex === 0}
            className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-30"
            aria-label="이전"
          >
            <ChevronLeft size={22} className="text-gray-600" />
          </button>

          <button
            onClick={readPage}
            disabled={isReading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {isReading ? <Pause size={18} /> : <Play size={18} />}
            {isReading ? '읽는 중...' : '읽어주세요'}
          </button>

          <button
            onClick={nextPage}
            className="p-3 rounded-xl bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-colors"
            aria-label="다음"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* 진행 바 */}
        <div className="max-w-lg mx-auto px-5 mt-3">
          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              animate={{ width: `${((pageIndex + 1) / story.pages.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
