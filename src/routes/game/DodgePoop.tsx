import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Bomb, Star, Trophy, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameTimer } from '@/hooks/useGameTimer'
import { playCorrect, playWrong } from '@/lib/audio'

const GAME_TIME = 30
const BASE_PLAYER_SIZE = 80 // px (desktop)
const BASE_POOP_SIZE = 64 // px (desktop)
const BASE_PLAYER_SPEED = 6 // px per frame
const HIT_SHRINK = 0.8 // 충돌 판정을 실제 크기의 80%로

// 화면 너비에 따라 크기 스케일 (360px 기준 → 0.65배, 768px 이상 → 1배)
function getScale(width: number) {
  return Math.max(0.55, Math.min(1, width / 768))
}

interface Poop {
  id: number
  x: number // px from left
  y: number // px from top
  speed: number // px per frame
}

export default function DodgePoop() {
  useGameTimer()
  const { soundEnabled } = useSettingsStore()
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hit, setHit] = useState(false)
  const [scorePopups, setScorePopups] = useState<{ id: number; x: number; y: number }[]>([])
  const popupId = useRef(0)

  // All game state in refs for rAF loop
  const playerXRef = useRef(0)
  const [playerX, setPlayerX] = useState(0)
  const poopsRef = useRef<Poop[]>([])
  const [renderPoops, setRenderPoops] = useState<Poop[]>([])
  const nextId = useRef(0)
  const frameRef = useRef<number>(undefined)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const spawnRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const scoreRef = useRef(0)
  const runningRef = useRef(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef(0)

  // Movement: track which direction is being held
  const moveDir = useRef(0) // -1 left, 0 none, 1 right
  const [movingDir, setMovingDir] = useState(0) // for render: -1 left, 0 idle, 1 right
  const [walkFrame, setWalkFrame] = useState(0) // 0~3 sprite frame
  const walkIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  // Touch drag tracking
  const touchStartX = useRef(0)
  const playerStartX = useRef(0)
  const dragging = useRef(false)

  const getArea = () => {
    const el = areaRef.current
    return { w: el?.clientWidth ?? 300, h: el?.clientHeight ?? 500 }
  }

  const getSizes = () => {
    const { w } = getArea()
    const s = getScale(w)
    return {
      playerSize: Math.round(BASE_PLAYER_SIZE * s),
      poopSize: Math.round(BASE_POOP_SIZE * s),
      playerSpeed: BASE_PLAYER_SPEED * s,
    }
  }

  // 시간에 따라 스폰 간격, 속도, 동시 개수 증가 (좁은 화면은 burst 제한)
  const getDifficulty = () => {
    const { w } = getArea()
    const narrow = w < 400
    const t = elapsedRef.current
    if (t < 5) return { interval: 500, speed: 2.5, burst: 1 }
    if (t < 10) return { interval: 380, speed: 3, burst: 1 }
    if (t < 15) return { interval: 300, speed: 3.5, burst: narrow ? 1 : 2 }
    if (t < 20) return { interval: 250, speed: 4, burst: narrow ? 1 : 2 }
    if (t < 25) return { interval: 200, speed: 4.5, burst: narrow ? 2 : 3 }
    return { interval: 150, speed: 5, burst: narrow ? 2 : 3 }
  }

  const spawnPoop = useCallback(() => {
    if (!runningRef.current) return
    const { w } = getArea()
    const { poopSize } = getSizes()
    const margin = poopSize
    const { speed, burst } = getDifficulty()
    for (let i = 0; i < burst; i++) {
      const p: Poop = {
        id: nextId.current++,
        x: margin + Math.random() * (w - margin * 2),
        y: -poopSize - i * 20,
        speed: speed + Math.random() * 1.5,
      }
      poopsRef.current = [...poopsRef.current, p]
    }
  }, [])

  const gameLoop = useCallback(() => {
    if (!runningRef.current) return
    const { w, h } = getArea()
    const { playerSize, poopSize, playerSpeed } = getSizes()

    // Move player (playerX = center point due to translateX(-50%))
    if (moveDir.current !== 0) {
      playerXRef.current = Math.max(
        playerSize / 2,
        Math.min(w - playerSize / 2, playerXRef.current + moveDir.current * playerSpeed),
      )
      setPlayerX(playerXRef.current)
      setMovingDir(moveDir.current)
    } else {
      setMovingDir(0)
    }

    const px = playerXRef.current // center x
    const py = h - playerSize - 8
    // Shrunk hitbox for forgiving collision
    const hs = (playerSize * (1 - HIT_SHRINK)) / 2
    const pLeft = px - playerSize / 2 + hs
    const pRight = px + playerSize / 2 - hs
    const pTop = py + hs
    const pBottom = py + playerSize - hs

    let hitDetected = false
    const alive: Poop[] = []

    for (const p of poopsRef.current) {
      const newY = p.y + p.speed
      if (newY > h + poopSize) {
        scoreRef.current += 1
        setScore(scoreRef.current)
        // +1 팝업 at landing position
        const pid = popupId.current++
        setScorePopups((prev) => [...prev, { id: pid, x: p.x, y: h - 20 }])
        setTimeout(() => setScorePopups((prev) => prev.filter((v) => v.id !== pid)), 700)
        continue
      }
      // AABB collision
      const poopHs = (poopSize * (1 - HIT_SHRINK)) / 2
      const oLeft = p.x - poopSize / 2 + poopHs
      const oRight = p.x + poopSize / 2 - poopHs
      const oTop = newY - poopSize / 2 + poopHs
      const oBottom = newY + poopSize / 2 - poopHs

      if (pLeft < oRight && pRight > oLeft && pTop < oBottom && pBottom > oTop) {
        hitDetected = true
        break
      }
      alive.push({ ...p, y: newY })
    }

    if (hitDetected) {
      runningRef.current = false
      clearInterval(timerRef.current)
      clearTimeout(spawnRef.current)
      if (soundEnabled) playWrong()
      setHit(true)
      setFinished(true)
      poopsRef.current = []
      setRenderPoops([])
      setScorePopups([])
      return
    }

    poopsRef.current = alive
    setRenderPoops([...alive])
    frameRef.current = requestAnimationFrame(gameLoop)
  }, [])

  const start = () => {
    const { w } = getArea()
    const startX = w / 2
    playerXRef.current = startX
    setPlayerX(startX)
    setStarted(true)
    setFinished(false)
    setHit(false)
    setScore(0)
    setTimeLeft(GAME_TIME)
    poopsRef.current = []
    setRenderPoops([])
    nextId.current = 0
    scoreRef.current = 0
    moveDir.current = 0
    elapsedRef.current = 0
    runningRef.current = true

    frameRef.current = requestAnimationFrame(gameLoop)

    // 동적 스폰: 매 초마다 난이도에 맞게 스폰 간격 재설정
    const scheduleSpawn = () => {
      if (!runningRef.current) return
      spawnPoop()
      const { interval } = getDifficulty()
      spawnRef.current = setTimeout(scheduleSpawn, interval + Math.random() * 100)
    }
    spawnRef.current = setTimeout(scheduleSpawn, 400)

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setTimeLeft((t) => {
        if (t <= 1) {
          runningRef.current = false
          clearInterval(timerRef.current)
          clearTimeout(spawnRef.current)
          cancelAnimationFrame(frameRef.current!)
          if (soundEnabled) playCorrect()
          setFinished(true)
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
      clearTimeout(spawnRef.current)
      cancelAnimationFrame(frameRef.current!)
      clearInterval(walkIntervalRef.current)
    }
  }, [])

  // Walk frame animation cycle
  useEffect(() => {
    if (movingDir !== 0) {
      setWalkFrame(0)
      walkIntervalRef.current = setInterval(() => {
        setWalkFrame((f) => (f + 1) % 4)
      }, 120)
      return () => clearInterval(walkIntervalRef.current)
    } else {
      clearInterval(walkIntervalRef.current)
      setWalkFrame(0)
    }
  }, [movingDir])

  // Touch: drag to move player directly
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!runningRef.current) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragging.current = true
    touchStartX.current = e.clientX
    playerStartX.current = playerXRef.current
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !runningRef.current) return
    const { w } = getArea()
    const { playerSize } = getSizes()
    const dx = e.clientX - touchStartX.current
    const newX = Math.max(playerSize / 2, Math.min(w - playerSize / 2, playerStartX.current + dx))
    const prevX = playerXRef.current
    playerXRef.current = newX
    setPlayerX(newX)
    if (Math.abs(newX - prevX) > 0.5) setMovingDir(newX > prevX ? 1 : -1)
    else setMovingDir(0)
  }

  const handlePointerUp = () => {
    dragging.current = false
    setMovingDir(0)
  }

  // Keyboard: hold arrow keys
  useEffect(() => {
    const keys = new Set<string>()
    const update = () => {
      if (keys.has('ArrowLeft') || keys.has('a')) moveDir.current = -1
      else if (keys.has('ArrowRight') || keys.has('d')) moveDir.current = 1
      else moveDir.current = 0
    }
    const down = (e: KeyboardEvent) => { keys.add(e.key); update() }
    const up = (e: KeyboardEvent) => { keys.delete(e.key); update() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-amber-50 via-orange-50/30 to-slate-50 p-4 pt-[max(1rem,env(safe-area-inset-top))] overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
          <ChevronLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Bomb size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">똥 피하기</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/60">
          <Star size={14} className="text-orange-500" fill="currentColor" />
          <span className="text-sm font-bold text-orange-600">{score}</span>
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
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${hit ? 'from-rose-400 to-red-500' : 'from-amber-400 to-orange-500'} flex items-center justify-center shadow-md`}>
                {hit ? <AlertTriangle size={28} className="text-white" /> : <Trophy size={28} className="text-white" />}
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {hit ? '으악! 맞았다!' : `${score}개 피했어요!`}
              </p>
              <p className="text-gray-500 mt-1">{score}점</p>
            </motion.div>
          )}
          <button
            onClick={start}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xl font-bold shadow-lg shadow-amber-500/25 transition-all"
          >
            {finished ? '다시 하기' : '시작!'}
          </button>
          {!finished && (
            <p className="text-gray-400 text-sm text-center">
              손가락을 드래그해서<br />피하세요!
            </p>
          )}
        </main>
      ) : (
        <>
          <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 rounded-full"
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            />
          </div>
          <p className="text-center text-gray-400 text-sm mt-1 font-medium">{timeLeft}초</p>

          <div
            ref={areaRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex-1 relative mt-2 touch-none select-none overflow-hidden rounded-2xl bg-gradient-to-b from-green-100 to-green-200 border-2 border-green-300"
          >
            {/* Score popups */}
            {scorePopups.map((sp) => (
              <motion.span
                key={sp.id}
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{ y: -40, opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute text-sm font-black text-green-500 pointer-events-none z-10 drop-shadow-md"
                style={{ left: sp.x, top: sp.y, transform: 'translateX(-50%)' }}
              >
                +1
              </motion.span>
            ))}

            {/* Poops */}
            {renderPoops.map((p) => {
              const ps = getSizes().poopSize
              return (
                <div
                  key={p.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: p.x,
                    top: p.y,
                    width: ps,
                    height: ps,
                    transform: 'translate(-50%, -50%)',
                    fontSize: ps - 4,
                    lineHeight: 1,
                    textAlign: 'center',
                    willChange: 'top',
                  }}
                >
                  💩
                </div>
              )
            })}

            {/* Player - 뽀로로 (스프라이트 시트 애니메이션) */}
            {(() => {
              const ps = getSizes().playerSize
              // 스프라이트: 5열 1행 [왼쪽1, 왼쪽2, 정면, 오른쪽1, 오른쪽2]
              let spriteCol: number
              if (movingDir === -1) {
                spriteCol = walkFrame % 2 === 0 ? 0 : 1 // 왼쪽 프레임 교대
              } else if (movingDir === 1) {
                spriteCol = walkFrame % 2 === 0 ? 3 : 4 // 오른쪽 프레임 교대
              } else {
                spriteCol = 2 // 정면
              }
              const spriteW = ps * 5
              const spriteH = ps * 1.8 // 174:314 비율
              return (
                <div
                  className="absolute pointer-events-none overflow-hidden"
                  style={{
                    left: playerX,
                    bottom: -4,
                    width: ps,
                    height: spriteH,
                    transform: 'translateX(-50%)',
                    backgroundImage: `url(${import.meta.env.BASE_URL}images/pororo_sprite.png)`,
                    backgroundSize: `${spriteW}px ${spriteH}px`,
                    backgroundPosition: `${-spriteCol * ps}px 0`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
