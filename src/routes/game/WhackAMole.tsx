import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Target, Star, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCorrect } from '@/lib/audio'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useRecordsStore } from '@/stores/recordsStore'

const GRID = 9 // 3x3
const GAME_TIME = 30 // 30초

export default function WhackAMole() {
  useGameTimer()
  const { soundEnabled } = useSettingsStore()
  const { updateHighScore, getHighScore } = useRecordsStore()
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => getHighScore('game/whack'))
  const [actives, setActives] = useState<Set<number>>(new Set())
  const [goldens, setGoldens] = useState<Set<number>>(new Set())
  const activesRef = useRef<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [popups, setPopups] = useState<{ id: number; slot: number; points: number }[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const moleTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const runningRef = useRef(false)
  const scoreRef = useRef(0)
  const elapsedRef = useRef(0)
  const popupId = useRef(0)

  // 난이도에 따라 동시 두더지 수, 표시 시간, 간격 결정
  const getDifficulty = () => {
    const t = elapsedRef.current
    if (t < 5) return { maxMoles: 1, showTime: 1000, gap: 600 }      // 0~5초: 1마리, 느림
    if (t < 12) return { maxMoles: 1, showTime: 700, gap: 400 }      // 5~12초: 1마리, 빠름
    if (t < 20) return { maxMoles: 2, showTime: 650, gap: 350 }      // 12~20초: 2마리
    return { maxMoles: 3, showTime: 550, gap: 250 }                   // 20초~: 3마리
  }

  const pickRandomSlots = (count: number, exclude: Set<number>) => {
    const available = Array.from({ length: GRID }, (_, i) => i).filter((i) => !exclude.has(i))
    const picks: number[] = []
    for (let i = 0; i < Math.min(count, available.length); i++) {
      const idx = Math.floor(Math.random() * available.length)
      picks.push(available[idx])
      available.splice(idx, 1)
    }
    return picks
  }

  const showMoles = () => {
    if (!runningRef.current) return
    const { maxMoles, showTime, gap } = getDifficulty()

    setActives((prev) => {
      // 몇 마리 더 보여줄지 (현재 활성 수 고려)
      const toAdd = Math.max(1, maxMoles - prev.size)
      const slots = pickRandomSlots(toAdd, prev)
      const next = new Set(prev)

      for (const slot of slots) {
        next.add(slot)
        activesRef.current.add(slot)
        // ~13% 확률로 골든 두더지 (2점)
        if (Math.random() < 0.13) {
          setGoldens((g) => new Set(g).add(slot))
        }
        // 각 두더지 개별 타이머: 일정 시간 후 사라짐
        const hideDelay = showTime + Math.random() * 300
        const timer = setTimeout(() => {
          if (!runningRef.current) return
          activesRef.current.delete(slot)
          setActives((s) => {
            const n = new Set(s)
            n.delete(slot)
            return n
          })
          setGoldens((g) => {
            const n = new Set(g)
            n.delete(slot)
            return n
          })
          moleTimers.current.delete(slot)
        }, hideDelay)
        moleTimers.current.set(slot, timer)
      }

      return next
    })

    // 다음 웨이브 예약
    if (runningRef.current) {
      const nextGap = gap + Math.random() * 200
      setTimeout(showMoles, nextGap)
    }
  }

  const start = () => {
    setStarted(true)
    setFinished(false)
    setScore(0)
    scoreRef.current = 0
    elapsedRef.current = 0
    setTimeLeft(GAME_TIME)
    setActives(new Set())
    setGoldens(new Set())
    activesRef.current = new Set()
    moleTimers.current.forEach((t) => clearTimeout(t))
    moleTimers.current.clear()
    runningRef.current = true

    // 첫 두더지 약간 딜레이 후 시작
    setTimeout(showMoles, 500)

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setTimeLeft((t) => {
        if (t <= 1) {
          runningRef.current = false
          clearInterval(timerRef.current)
          moleTimers.current.forEach((tm) => clearTimeout(tm))
          moleTimers.current.clear()
          setActives(new Set())
          setFinished(true)
          if (updateHighScore('game/whack', scoreRef.current)) {
            setBestScore(scoreRef.current)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      runningRef.current = false
      clearInterval(timerRef.current)
      moleTimers.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const whack = (idx: number) => {
    if (!activesRef.current.has(idx)) return
    activesRef.current.delete(idx)
    setActives(new Set(activesRef.current))
    // golden 체크
    const isGolden = goldens.has(idx)
    const points = isGolden ? 2 : 1
    if (soundEnabled) playCorrect()
    scoreRef.current += points
    setScore(scoreRef.current)
    // 팝업 효과
    const pid = popupId.current++
    setPopups((p) => [...p, { id: pid, slot: idx, points }])
    setTimeout(() => setPopups((p) => p.filter((v) => v.id !== pid)), 700)
    // 골든 제거
    if (isGolden) {
      setGoldens((g) => { const n = new Set(g); n.delete(idx); return n })
    }
    // 해당 두더지 타이머 취소
    const timer = moleTimers.current.get(idx)
    if (timer) {
      clearTimeout(timer)
      moleTimers.current.delete(idx)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-emerald-50 via-green-50/30 to-slate-50 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between mb-4">
        <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
          <ChevronLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-sm">
            <Target size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">두더지잡기</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {bestScore > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1.5">
              <Trophy size={13} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-700">{bestScore}</span>
            </div>
          )}
          <div className="bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/60 flex items-center gap-1.5">
            <Star size={14} className="text-orange-500" fill="currentColor" />
            <span className="text-sm font-bold text-orange-600">{score}</span>
          </div>
        </div>
      </header>

      {!started || finished ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-6">
          {finished && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
                <Trophy size={28} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{score}마리</p>
              <p className="text-gray-500 mt-1">잡았어요!</p>
            </motion.div>
          )}
          <button
            onClick={start}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl text-xl font-bold shadow-lg shadow-emerald-500/25 transition-all"
          >
            {finished ? '다시 하기' : '시작!'}
          </button>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center gap-4">
          <div className="w-full max-w-sm bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 rounded-full"
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm font-medium">{timeLeft}초</p>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm mt-2 touch-manipulation">
            {Array.from({ length: GRID }).map((_, i) => (
              <button
                key={i}
                onPointerDown={() => whack(i)}
                className="aspect-square rounded-2xl bg-white border border-gray-200/80 shadow-sm flex items-center justify-center text-5xl select-none touch-manipulation active:scale-95 transition-transform relative overflow-visible hover:border-emerald-300"
              >
                <AnimatePresence>
                  {actives.has(i) && (
                    <motion.span
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={goldens.has(i) ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : ''}
                    >
                      {goldens.has(i) ? '⭐' : '🐹'}
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {popups.filter((p) => p.slot === i).map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ y: 0, opacity: 1, scale: 1 }}
                      animate={{ y: -50, opacity: 0, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`absolute top-0 left-1/2 -translate-x-1/2 text-lg font-black pointer-events-none z-10 drop-shadow-md ${p.points >= 2 ? 'text-yellow-500' : 'text-orange-500'}`}
                    >
                      +{p.points}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}
