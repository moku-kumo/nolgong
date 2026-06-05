import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Star, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCorrect } from '@/lib/audio'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameTimer } from '@/hooks/useGameTimer'
import { randInt } from '@/lib/random'

interface Balloon {
  id: number
  x: number // 0~80 (%)
  color: string
  emoji: string
  speed: number // px/s
  y: number
}

const COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400',
  'bg-pink-400', 'bg-purple-400', 'bg-orange-400',
]
const EMOJIS = ['🎈', '🎈', '🎈', '⭐', '🌟', '💎']
const GAME_TIME = 30

export default function BalloonPop() {
  useGameTimer()
  const { soundEnabled } = useSettingsStore()
  const [score, setScore] = useState(0)
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const nextId = useRef(0)
  const frameRef = useRef<number>(undefined)
  const lastTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const spawn = useCallback(() => {
    const b: Balloon = {
      id: nextId.current++,
      x: randInt(5, 80),
      color: COLORS[randInt(0, COLORS.length - 1)],
      emoji: EMOJIS[randInt(0, EMOJIS.length - 1)],
      speed: 60 + Math.random() * 80,
      y: 110, // start below screen
    }
    setBalloons((prev) => [...prev, b])
  }, [])

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time
    const dt = (time - lastTimeRef.current) / 1000
    lastTimeRef.current = time

    setBalloons((prev) =>
      prev
        .map((b) => ({ ...b, y: b.y - b.speed * dt }))
        .filter((b) => b.y > -15)
    )
    frameRef.current = requestAnimationFrame(animate)
  }, [])

  const start = () => {
    setStarted(true)
    setFinished(false)
    setScore(0)
    setTimeLeft(GAME_TIME)
    setBalloons([])
    nextId.current = 0
    lastTimeRef.current = 0

    frameRef.current = requestAnimationFrame(animate)
    spawnRef.current = setInterval(spawn, 700)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          clearInterval(spawnRef.current)
          cancelAnimationFrame(frameRef.current!)
          setFinished(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearInterval(spawnRef.current)
      cancelAnimationFrame(frameRef.current!)
    }
  }, [])

  const pop = (id: number) => {
    if (soundEnabled) playCorrect()
    setScore((s) => s + 1)
    setBalloons((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-sky-50 via-blue-50/30 to-slate-50 p-4 pt-[max(1rem,env(safe-area-inset-top))] overflow-hidden relative">
      <header className="flex items-center justify-between mb-4 relative z-10">
        <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
          <ChevronLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">🎈</span>
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">풍선 터뜨리기</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/60">
          <Star size={14} className="text-orange-500" fill="currentColor" />
          <span className="text-sm font-bold text-orange-600">{score}</span>
        </div>
      </header>

      {!started || finished ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
          {finished && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md">
                <Trophy size={28} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{score}개</p>
              <p className="text-gray-500 mt-1">터뜨렸어요!</p>
            </motion.div>
          )}
          <button
            onClick={start}
            className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl text-xl font-bold shadow-lg shadow-sky-500/25 transition-all"
          >
            {finished ? '다시 하기' : '시작!'}
          </button>
        </main>
      ) : (
        <>
          <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-2.5 overflow-hidden relative z-10">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-1000 rounded-full"
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            />
          </div>
          <p className="text-center text-gray-400 text-sm mt-1 relative z-10 font-medium">{timeLeft}초</p>

          <div className="flex-1 relative mt-4">
            <AnimatePresence>
              {balloons.map((b) => (
                <motion.button
                  key={b.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => pop(b.id)}
                  className="absolute text-4xl active:scale-150 transition-transform"
                  style={{
                    left: `${b.x}%`,
                    bottom: `${b.y}%`,
                  }}
                >
                  {b.emoji}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
