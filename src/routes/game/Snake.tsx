import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Star, Trophy, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { playCorrect } from '@/lib/audio'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameTimer } from '@/hooks/useGameTimer'
import { randInt } from '@/lib/random'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Cell = { x: number; y: number }

const GRID_SIZE = 15
const CELL_SIZE_PERCENT = 100 / GRID_SIZE
const INITIAL_SPEED = 350 // ms per tick (아이용 느린 시작)
const SPEED_INCREMENT = 3 // ms faster per food eaten

const INITIAL_SNAKE: Cell[] = [
  { x: 9, y: 7 },
  { x: 8, y: 7 },
  { x: 7, y: 7 },
]

const FOOD_EMOJI = '🍎'

function getOpposite(dir: Direction): Direction {
  switch (dir) {
    case 'UP': return 'DOWN'
    case 'DOWN': return 'UP'
    case 'LEFT': return 'RIGHT'
    case 'RIGHT': return 'LEFT'
  }
}

export default function Snake() {
  useGameTimer()
  const { soundEnabled } = useSettingsStore()

  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-highscore')
    return saved ? parseInt(saved, 10) : 0
  })

  const [snake, setSnake] = useState<Cell[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Cell>({ x: 3, y: 3 })

  const dirRef = useRef<Direction>('RIGHT')
  const dirQueueRef = useRef<Direction[]>([])
  const snakeRef = useRef<Cell[]>(INITIAL_SNAKE)
  const foodRef = useRef<Cell>({ x: 3, y: 3 })
  const speedRef = useRef(INITIAL_SPEED)
  const tickRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const spawnFood = useCallback((currentSnake: Cell[]): Cell => {
    let pos: Cell
    do {
      pos = { x: randInt(0, GRID_SIZE - 1), y: randInt(0, GRID_SIZE - 1) }
    } while (currentSnake.some(s => s.x === pos.x && s.y === pos.y))
    return pos
  }, [])

  const gameOver = useCallback(() => {
    clearTimeout(tickRef.current)
    setFinished(true)
    setScore(prev => {
      if (prev > highScore) {
        setHighScore(prev)
        localStorage.setItem('snake-highscore', String(prev))
      }
      return prev
    })
  }, [highScore])

  const tick = useCallback(() => {
    const currentSnake = snakeRef.current

    // Process direction queue - take next valid direction
    while (dirQueueRef.current.length > 0) {
      const nextDir = dirQueueRef.current.shift()!
      if (nextDir !== getOpposite(dirRef.current)) {
        dirRef.current = nextDir
        break
      }
    }

    const head = currentSnake[0]
    const dir = dirRef.current

    let newHead: Cell
    switch (dir) {
      case 'UP': newHead = { x: head.x, y: head.y - 1 }; break
      case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break
      case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break
      case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameOver()
      return
    }

    // Self collision (exclude tail since it will move)
    const bodyToCheck = currentSnake.slice(0, -1)
    if (bodyToCheck.some(s => s.x === newHead.x && s.y === newHead.y)) {
      gameOver()
      return
    }

    let newSnake: Cell[]
    const currentFood = foodRef.current

    if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
      newSnake = [newHead, ...currentSnake]
      const newFood = spawnFood(newSnake)
      foodRef.current = newFood
      setFood(newFood)
      setScore(prev => prev + 10)
      speedRef.current = Math.max(80, speedRef.current - SPEED_INCREMENT)
      if (soundEnabled) playCorrect()
    } else {
      newSnake = [newHead, ...currentSnake.slice(0, -1)]
    }

    snakeRef.current = newSnake
    setSnake(newSnake)

    tickRef.current = setTimeout(tick, speedRef.current)
  }, [gameOver, soundEnabled, spawnFood])

  const startGame = useCallback(() => {
    const initialSnake = [...INITIAL_SNAKE]
    const initialFood = spawnFood(initialSnake)
    snakeRef.current = initialSnake
    foodRef.current = initialFood
    dirRef.current = 'RIGHT'
    dirQueueRef.current = []
    speedRef.current = INITIAL_SPEED

    setSnake(initialSnake)
    setFood(initialFood)
    setScore(0)
    setFinished(false)
    setStarted(true)

    tickRef.current = setTimeout(tick, speedRef.current)
  }, [spawnFood, tick])

  // Enqueue direction (allows fast consecutive turns)
  const enqueueDir = useCallback((newDir: Direction) => {
    const lastDir = dirQueueRef.current.length > 0
      ? dirQueueRef.current[dirQueueRef.current.length - 1]
      : dirRef.current

    if (newDir !== getOpposite(lastDir) && newDir !== lastDir) {
      dirQueueRef.current.push(newDir)
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    if (!started || finished) return

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': enqueueDir('UP'); break
        case 'ArrowDown': enqueueDir('DOWN'); break
        case 'ArrowLeft': enqueueDir('LEFT'); break
        case 'ArrowRight': enqueueDir('RIGHT'); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [started, finished, enqueueDir])

  // Touch controls (swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx < 20 && absDy < 20) return

    if (absDx > absDy) {
      enqueueDir(dx > 0 ? 'RIGHT' : 'LEFT')
    } else {
      enqueueDir(dy > 0 ? 'DOWN' : 'UP')
    }
  }, [enqueueDir])

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(tickRef.current)
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-50 via-emerald-50/30 to-slate-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">스네이크 게임</h1>
          <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            {score}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 flex flex-col items-center">
        {/* Game Board */}
        <div
          className="relative w-full aspect-square max-w-[360px] bg-emerald-900 rounded-2xl overflow-hidden border-4 border-emerald-700 shadow-lg"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Grid pattern - rail tracks style */}
          <div className="absolute inset-0 opacity-[0.07]">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full border-b border-white" style={{ top: `${(i + 1) * CELL_SIZE_PERCENT}%` }} />
            ))}
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full border-r border-white" style={{ left: `${(i + 1) * CELL_SIZE_PERCENT}%` }} />
            ))}
          </div>

          {/* Food */}
          <motion.div
            key={`food-${food.x}-${food.y}`}
            className="absolute flex items-center justify-center"
            style={{
              left: `${food.x * CELL_SIZE_PERCENT}%`,
              top: `${food.y * CELL_SIZE_PERCENT}%`,
              width: `${CELL_SIZE_PERCENT}%`,
              height: `${CELL_SIZE_PERCENT}%`,
              fontSize: '1.1rem',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            {FOOD_EMOJI}
          </motion.div>

          {/* Snake */}
          {snake.map((cell, i) => {
            const ratio = i / Math.max(snake.length - 1, 1)
            const lightness = 45 + ratio * 20 // head darker, tail lighter
            const size = 90 - ratio * 20 // head bigger, tail smaller
            return (
              <div
                key={i}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${cell.x * CELL_SIZE_PERCENT}%`,
                  top: `${cell.y * CELL_SIZE_PERCENT}%`,
                  width: `${CELL_SIZE_PERCENT}%`,
                  height: `${CELL_SIZE_PERCENT}%`,
                }}
              >
                <div
                  className="rounded-full relative"
                  style={{
                    width: `${size}%`,
                    height: `${size}%`,
                    backgroundColor: `hsl(140, 70%, ${lightness}%)`,
                    boxShadow: i === 0 ? '0 0 6px rgba(0,0,0,0.3)' : undefined,
                  }}
                >
                  {i === 0 && (
                    <>
                      <div className="absolute top-[18%] left-[15%] w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center">
                        <div className="w-[55%] h-[55%] bg-gray-900 rounded-full" />
                      </div>
                      <div className="absolute top-[18%] right-[15%] w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center">
                        <div className="w-[55%] h-[55%] bg-gray-900 rounded-full" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {/* Start overlay */}
          {!started && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 z-10">
              <div className="w-16 h-16 bg-green-400 rounded-full relative shadow-lg">
                <div className="absolute top-[20%] left-[15%] w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center">
                  <div className="w-[55%] h-[55%] bg-gray-900 rounded-full" />
                </div>
                <div className="absolute top-[20%] right-[15%] w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center">
                  <div className="w-[55%] h-[55%] bg-gray-900 rounded-full" />
                </div>
              </div>
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
              >
                <Play size={20} /> 시작!
              </button>
              <p className="text-white/60 text-sm">스와이프 또는 방향키로 조작</p>
            </div>
          )}

          {/* Game Over overlay */}
          {finished && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10">
              <Trophy size={48} className="text-yellow-400" />
              <p className="text-white text-xl font-bold">게임 오버!</p>
              <p className="text-white/80 text-lg">점수: {score}</p>
              {score >= highScore && score > 0 && (
                <p className="text-yellow-300 text-sm font-bold">🎉 최고 기록!</p>
              )}
              <button
                onClick={startGame}
                className="mt-2 flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
              >
                <Play size={20} /> 다시 하기
              </button>
            </div>
          )}
        </div>

        {/* D-Pad Controls */}
        {started && !finished && (
          <div className="mt-5 grid grid-cols-3 gap-3 w-[260px]">
            <div />
            <button
              onPointerDown={() => enqueueDir('UP')}
              className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-200 flex items-center justify-center text-3xl active:bg-gray-100 active:scale-95 transition-all select-none"
            >
              ⬆️
            </button>
            <div />
            <button
              onPointerDown={() => enqueueDir('LEFT')}
              className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-200 flex items-center justify-center text-3xl active:bg-gray-100 active:scale-95 transition-all select-none"
            >
              ⬅️
            </button>
            <div className="w-20 h-20" />
            <button
              onPointerDown={() => enqueueDir('RIGHT')}
              className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-200 flex items-center justify-center text-3xl active:bg-gray-100 active:scale-95 transition-all select-none"
            >
              ➡️
            </button>
            <div />
            <button
              onPointerDown={() => enqueueDir('DOWN')}
              className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-200 flex items-center justify-center text-3xl active:bg-gray-100 active:scale-95 transition-all select-none"
            >
              ⬇️
            </button>
            <div />
          </div>
        )}

        {/* High Score */}
        <div className="mt-4 text-sm text-gray-500">
          최고 기록: <span className="font-bold text-amber-600">{highScore}</span>점
        </div>
      </main>
    </div>
  )
}
