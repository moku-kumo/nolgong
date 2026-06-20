import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, RotateCcw, Trophy, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCorrect, playWrong } from '@/lib/audio'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useRecordsStore } from '@/stores/recordsStore'
import { shuffle } from '@/lib/random'

const FLAG_CODES = [
  'kr', 'us', 'jp', 'gb', 'fr', 'de', 'it', 'cn',
  'br', 'ca', 'au', 'es', 'mx', 'in', 'th', 'vn', 'tr', 'se',
]

const THEMES = {
  animals: {
    label: '동물', icon: '🐶',
    items: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁', '🐯', '🐮', '🐷', '🐔', '🐧', '🐙', '🦋', '🐢', '🐳'],
  },
  flags: {
    label: '국기', icon: '🏁',
    items: FLAG_CODES.map(code => `flag:${code}`),
  },
  food: {
    label: '음식', icon: '🍕',
    items: ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍎', '🍓', '🍌', '🍇', '🍰', '🧁', '🍪', '🍫', '🍿', '🥐', '🍙', '🥝'],
  },
}

type ThemeKey = keyof typeof THEMES

function FlagImg({ code, className }: { code: string; className?: string }) {
  return <img src={`https://flagcdn.com/w80/${code}.png`} alt={code} className={className ?? 'w-10 h-7 object-cover rounded-sm'} draggable={false} />
}

function CardContent({ value }: { value: string }) {
  if (value.startsWith('flag:')) {
    const code = value.slice(5)
    return <FlagImg code={code} className="w-12 h-8 sm:w-14 sm:h-10 object-cover rounded-sm shadow-sm" />
  }
  return <span>{value}</span>
}

const PAIR_COUNTS: Record<string, number> = {
  easy: 4,    // 4쌍 = 8장 (4x2)
  normal: 6,  // 6쌍 = 12장 (4x3)
  hard: 8,    // 8쌍 = 16장 (4x4)
}

type Difficulty = 'easy' | 'normal' | 'hard'

interface Card {
  id: number
  emoji: string
  matched: boolean
}

function createCards(pairCount: number, theme: ThemeKey): Card[] {
  const picked = shuffle([...THEMES[theme].items]).slice(0, pairCount)
  const pairs = [...picked, ...picked]
  return shuffle(pairs).map((emoji, i) => ({ id: i, emoji, matched: false }))
}

export default function MemoryMatch() {
  useGameTimer()
  const { soundEnabled } = useSettingsStore()
  const { updateBestTime, getBestTime } = useRecordsStore()
  const [bestTime, setBestTime] = useState(() => getBestTime('game/memory'))

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [theme, setTheme] = useState<ThemeKey | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const locked = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const pairCount = difficulty ? PAIR_COUNTS[difficulty] : 0

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff)
    setCards(createCards(PAIR_COUNTS[diff], theme!))
    setFlipped([])
    setMoves(0)
    setMatchedCount(0)
    setFinished(false)
    setStartTime(Date.now())
    setElapsed(0)
    locked.current = false
  }, [theme])

  const restart = useCallback(() => {
    if (difficulty && theme) startGame(difficulty)
  }, [difficulty, theme, startGame])

  // 타이머
  useEffect(() => {
    if (difficulty && !finished) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [difficulty, finished, startTime])

  // 게임 완료 체크
  useEffect(() => {
    if (pairCount > 0 && matchedCount === pairCount) {
      setFinished(true)
      clearInterval(timerRef.current)
      const finalElapsed = Math.floor((Date.now() - startTime) / 1000)
      if (updateBestTime('game/memory', finalElapsed)) {
        setBestTime(finalElapsed)
      }
    }
  }, [matchedCount, pairCount])

  const handleFlip = (id: number) => {
    if (locked.current) return
    if (flipped.includes(id)) return
    if (cards[id].matched) return

    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      locked.current = true
      setMoves((m) => m + 1)

      const [first, second] = newFlipped
      if (cards[first].emoji === cards[second].emoji) {
        // 매칭 성공
        if (soundEnabled) playCorrect()
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, matched: true } : c
            )
          )
          setMatchedCount((m) => m + 1)
          setFlipped([])
          locked.current = false
        }, 500)
      } else {
        // 매칭 실패
        if (soundEnabled) playWrong()
        setTimeout(() => {
          setFlipped([])
          locked.current = false
        }, 800)
      }
    }
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  // 테마 선택 화면
  if (!theme) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-purple-50/30 to-slate-50 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
            <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
              <ChevronLeft size={20} className="text-gray-500" />
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900">기억력 게임</h1>
            <div className="w-8" />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5 pb-10">
          <div className="text-6xl mb-6">🃏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">카드 뒤집기</h2>
          <p className="text-gray-400 mb-8">테마를 골라주세요!</p>
          <div className="w-full max-w-xs space-y-3">
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
              <motion.button
                key={key}
                onClick={() => setTheme(key)}
                className="w-full py-4 px-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-4"
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-4xl">{t.icon}</span>
                <div className="text-left">
                  <span className="font-bold text-gray-800 text-lg">{t.label}</span>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    {key === 'flags'
                      ? FLAG_CODES.slice(0, 6).map(c => <FlagImg key={c} code={c} className="w-6 h-4 object-cover rounded-[2px] inline-block" />)
                      : <>{t.items.slice(0, 6).join(' ')} ...</>}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // 난이도 선택 화면
  if (!difficulty) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-purple-50/30 to-slate-50 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
            <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
              <ChevronLeft size={20} className="text-gray-500" />
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900">기억력 게임</h1>
            <div className="w-8" />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5 pb-10">
          <div className="text-6xl mb-6">🃏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">카드 뒤집기</h2>
          <p className="text-gray-400 mb-8">같은 그림을 찾아 짝을 맞춰요!</p>
          <div className="w-full max-w-xs space-y-3">
            {([
              { diff: 'easy' as Difficulty, label: '쉬움', desc: '4쌍 (8장)', color: 'from-emerald-500 to-teal-600' },
              { diff: 'normal' as Difficulty, label: '보통', desc: '6쌍 (12장)', color: 'from-blue-500 to-indigo-600' },
              { diff: 'hard' as Difficulty, label: '어려움', desc: '8쌍 (16장)', color: 'from-purple-500 to-pink-600' },
            ]).map((opt) => (
              <motion.button
                key={opt.diff}
                onClick={() => startGame(opt.diff)}
                className={`w-full py-4 px-5 rounded-2xl bg-gradient-to-r ${opt.color} text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-between`}
                whileTap={{ scale: 0.97 }}
              >
                <span>{opt.label}</span>
                <span className="text-sm font-normal opacity-80">{opt.desc}</span>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const cols = difficulty === 'easy' ? 4 : 4

  // 게임 완료 화면
  if (finished) {
    const stars = moves <= pairCount + 2 ? 3 : moves <= pairCount * 2 ? 2 : 1
    return (
      <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-purple-50/30 to-slate-50 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
            <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
              <ChevronLeft size={20} className="text-gray-500" />
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900">기억력 게임</h1>
            <div className="w-8" />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5 pb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <Trophy size={64} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">축하해요! 🎉</h2>
            <div className="text-4xl mb-4">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={i < stars ? '' : 'opacity-20'}>⭐</span>
              ))}
            </div>
            <div className="flex gap-6 justify-center text-gray-500 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{moves}</p>
                <p className="text-xs">시도 횟수</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{mins}:{String(secs).padStart(2, '0')}</p>
                <p className="text-xs">걸린 시간</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={restart}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={18} /> 다시하기
              </motion.button>
              <Link
                to="/game"
                className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
              >
                게임 목록
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-purple-50/30 to-slate-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">기억력 게임</h1>
          <div className="flex items-center gap-1.5">
            {bestTime !== null && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1.5">
                <Timer size={13} className="text-blue-500" />
                <span className="text-xs font-bold text-amber-700">{Math.floor(bestTime / 60)}:{String(bestTime % 60).padStart(2, '0')}</span>
              </div>
            )}
            <button
              onClick={restart}
              className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors"
              aria-label="다시하기"
            >
              <RotateCcw size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 상태 바 */}
      <div className="max-w-lg mx-auto w-full px-5 pt-4 pb-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">시도: <span className="font-bold text-gray-700">{moves}</span></span>
          <span className="text-gray-400">짝: <span className="font-bold text-indigo-500">{matchedCount}/{pairCount}</span></span>
          <span className="text-gray-400">⏱ <span className="font-bold text-gray-700">{mins}:{String(secs).padStart(2, '0')}</span></span>
        </div>
      </div>

      {/* 카드 그리드 */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div
          className="grid gap-2.5 w-full max-w-sm"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id) || card.matched
            return (
              <motion.button
                key={card.id}
                onClick={() => handleFlip(card.id)}
                className={`aspect-square rounded-2xl text-3xl sm:text-4xl font-bold transition-all shadow-sm border-2 ${
                  card.matched
                    ? 'bg-emerald-50 border-emerald-200 scale-95 opacity-60'
                    : isFlipped
                      ? 'bg-white border-indigo-300 shadow-md'
                      : 'bg-gradient-to-br from-indigo-400 to-purple-500 border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                }`}
                whileTap={!isFlipped ? { scale: 0.9 } : undefined}
                layout
              >
                <AnimatePresence mode="wait">
                  {isFlipped ? (
                    <motion.span
                      key="emoji"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <CardContent value={card.emoji} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="back"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-white/60 text-2xl"
                    >
                      ?
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
