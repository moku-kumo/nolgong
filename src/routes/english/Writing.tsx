import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, RotateCcw, Volume2 } from 'lucide-react'
import { alphabet } from '@/data/alphabet'
import { englishWords, type WordEntry } from '@/data/englishWords'
import { englishStrokes } from '@/data/englishStrokes'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSpeech } from '@/hooks/useSpeech'

type PracticeMode = 'alphabet' | 'first'

const CANVAS_SIZE = 340
const WORD_CANVAS_WIDTH = 128
const WORD_CANVAS_HEIGHT = 144
const DRAW_COLOR = '#7c3aed'
const GUIDE_COLOR = '#5eead4'
const STROKE_GUIDE_COLOR = '#ec4899'
const letterSequence = alphabet.upper.flatMap((upper, index) => [upper, alphabet.lower[index]])
const fallbackWords: Record<string, WordEntry> = {
  x: { en: 'xylophone', ko: '실로폰', emoji: '🎵' },
}

function getWord(letter: string) {
  const lower = letter.toLowerCase()
  return englishWords.find((word) => word.en.startsWith(lower)) ?? fallbackWords[lower]
}

export default function EnglishWriting() {
  const { soundEnabled } = useSettingsStore()
  const { speak } = useSpeech()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<PracticeMode>('alphabet')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const letter = alphabet.upper[mode === 'first' ? currentIndex : Math.floor(currentIndex / 2)]
  const currentWord = mode === 'first' ? getWord(letter) : undefined
  const target = mode === 'first' ? letter : letterSequence[currentIndex]
  const canvasWidth = mode === 'first' ? WORD_CANVAS_WIDTH : CANVAS_SIZE
  const canvasHeight = mode === 'first' ? WORD_CANVAS_HEIGHT : CANVAS_SIZE
  const itemCount = mode === 'first' ? alphabet.upper.length : letterSequence.length

  const drawGuide = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.save()
    ctx.font = `bold ${mode === 'first' ? 108 : 230}px "Trebuchet MS", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = GUIDE_COLOR
    ctx.lineWidth = mode === 'first' ? 4 : 4
    ctx.globalAlpha = 0.55
    ctx.setLineDash(mode === 'first' ? [7, 5] : [8, 7])
    ctx.strokeText(target, canvasWidth / 2, canvasHeight / 2 + (mode === 'first' ? 2 : 8))
    ctx.fillStyle = GUIDE_COLOR
    ctx.globalAlpha = 0.1
    ctx.fillText(target, canvasWidth / 2, canvasHeight / 2 + (mode === 'first' ? 2 : 8))
    ctx.restore()

    if (mode === 'alphabet') {
      const strokes = englishStrokes[target] ?? []
      const guideSize = 230
      const guideOffset = (CANVAS_SIZE - guideSize) / 2
      const mapCoord = (value: number) => guideOffset + value * guideSize
      const labels: { x: number; y: number; startX: number; startY: number; number: number }[] = []

      ctx.save()
      strokes.forEach((stroke, index) => {
        // 점선 경로
        ctx.globalAlpha = 0.35
        ctx.strokeStyle = STROKE_GUIDE_COLOR
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.setLineDash([8, 6])
        ctx.beginPath()
        for (let i = 0; i < stroke.length; i++) {
          const x = mapCoord(stroke[i][0])
          const y = mapCoord(stroke[i][1])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // 화살표 방향 계산
        const startX = mapCoord(stroke[0][0])
        const startY = mapCoord(stroke[0][1])
        const endX = mapCoord(stroke[stroke.length - 1][0])
        const endY = mapCoord(stroke[stroke.length - 1][1])
        const prevIdx = stroke.length >= 2 ? stroke.length - 2 : 0
        const prevX = mapCoord(stroke[prevIdx][0])
        const prevY = mapCoord(stroke[prevIdx][1])
        const angle = Math.hypot(endX - prevX, endY - prevY) < 4
          ? Math.PI
          : Math.atan2(endY - prevY, endX - prevX)

        // 번호 위치 탐색
        const direction = Math.atan2(
          mapCoord(stroke[Math.min(1, stroke.length - 1)][1]) - startY,
          mapCoord(stroke[Math.min(1, stroke.length - 1)][0]) - startX
        )
        const candidateAngles = [direction - Math.PI / 2, direction + Math.PI / 2, direction + Math.PI, direction - Math.PI / 4, direction + Math.PI / 4]
        const candidates = [20, 30, 40].flatMap((distance) =>
          candidateAngles.map((candidateAngle) => ({
            x: startX + Math.cos(candidateAngle) * distance,
            y: startY + Math.sin(candidateAngle) * distance,
          }))
        )
        const position = candidates.find((candidate) => {
          const inside = candidate.x >= 14 && candidate.x <= CANVAS_SIZE - 14
            && candidate.y >= 14 && candidate.y <= CANVAS_SIZE - 14
          const separated = labels.every(
            (label) => Math.hypot(candidate.x - label.x, candidate.y - label.y) >= 27
          )
          return inside && separated
        }) ?? { x: startX, y: startY }

        labels.push({ ...position, startX, startY, number: index + 1 })

        // 화살표
        const arrowSize = 14
        ctx.globalAlpha = 0.4
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fillStyle = STROKE_GUIDE_COLOR
        ctx.fill()
      })

      labels.forEach((label) => {
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = STROKE_GUIDE_COLOR
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(label.startX, label.startY)
        ctx.lineTo(label.x, label.y)
        ctx.stroke()

        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(label.x, label.y, 15, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(label.x, label.y, 12.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(236, 72, 153, 0.9)'
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(label.number), label.x, label.y)
      })
      ctx.restore()
    }
  }, [canvasHeight, canvasWidth, mode, target])

  useEffect(() => {
    drawGuide()
  }, [drawGuide])

  useEffect(() => () => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
  }, [])

  const getPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvasWidth / rect.width),
      y: (event.clientY - rect.top) * (canvasHeight / rect.height),
    }
  }

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (checkTimer.current) clearTimeout(checkTimer.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getPosition(event)
    const ctx = canvasRef.current?.getContext('2d')
    setIsDrawing(true)
    setScore(null)
    lastPoint.current = point
    if (!ctx) return
    ctx.beginPath()
    ctx.arc(point.x, point.y, mode === 'first' ? 5 : 5.5, 0, Math.PI * 2)
    ctx.fillStyle = DRAW_COLOR
    ctx.fill()
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return
    event.preventDefault()
    const point = getPosition(event)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(point.x, point.y)
      ctx.strokeStyle = DRAW_COLOR
      ctx.lineWidth = mode === 'first' ? 10 : 11
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])
      ctx.stroke()
    }
    lastPoint.current = point
  }

  const checkDrawing = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pixels = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data
    let drawnPixels = 0
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index]
      const green = pixels[index + 1]
      const blue = pixels[index + 2]
      const alpha = pixels[index + 3]
      if (alpha > 50 && blue > 150 && red > 50 && green < 150) drawnPixels++
    }
    setScore(drawnPixels > (mode === 'first' ? 80 : 250) ? 100 : 0)
  }, [canvasHeight, canvasWidth, mode])

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    lastPoint.current = null
    checkTimer.current = setTimeout(checkDrawing, 3000)
  }

  const resetCanvas = useCallback(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    setScore(null)
    drawGuide()
  }, [drawGuide])

  const changeMode = (nextMode: PracticeMode) => {
    setMode(nextMode)
    setCurrentIndex(0)
    setScore(null)
  }

  const move = (direction: -1 | 1) => {
    setCurrentIndex((index) => (index + direction + itemCount) % itemCount)
    setScore(null)
  }

  const speakPrompt = () => {
    if (soundEnabled) speak(currentWord?.en ?? target, 'en-US')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-50">
      <header className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-lg items-center justify-between px-5">
          <Link to="/english" className="-ml-2 rounded-xl p-2.5 transition-colors hover:bg-gray-100/80" aria-label="영어로 돌아가기">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">영어 글씨 쓰기</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-10 pt-5">
        <div className="mb-5 grid grid-cols-2 gap-3">
          {([
            ['alphabet', '대/소문자'],
            ['first', '철 글자'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => changeMode(value)}
              className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
                mode === value ? 'bg-green-500 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'first' && currentWord ? (
          <motion.div
            key={currentWord.en}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex min-h-60 flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-100 bg-white px-5 py-5 shadow-sm"
          >
            <div className="flex min-w-0 items-end justify-center">
              <div className="relative h-36 w-32 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30">
                <div className="pointer-events-none absolute inset-x-0 bottom-6 h-px bg-emerald-200/70" />
                <canvas
                  ref={canvasRef}
                  width={WORD_CANVAS_WIDTH}
                  height={WORD_CANVAS_HEIGHT}
                  className="relative z-10 size-full touch-none cursor-crosshair"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerCancel={endDraw}
                />
              </div>
              <span className={`${currentWord.en.length > 7 ? 'text-2xl' : 'text-4xl'} pb-5 font-bold text-gray-800`}>
                {currentWord.en.slice(1)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4">
              <span className="text-5xl" aria-hidden="true">{currentWord.emoji}</span>
              <span className="text-xl font-bold text-gray-600">{currentWord.ko}</span>
              <button onClick={speakPrompt} className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50" aria-label={`${currentWord.en} 듣기`}>
                <Volume2 size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.button
              key={target}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={speakPrompt}
              className="mb-4 flex min-h-20 w-full items-center justify-center gap-4 rounded-xl border border-emerald-100 bg-white px-5 py-3 shadow-sm"
            >
              <span className="text-5xl font-bold text-emerald-600">{target}</span>
              <Volume2 size={20} className="text-emerald-500" />
            </motion.button>

            <div className="mb-6 flex justify-center">
              <div className="relative aspect-square w-full max-w-[340px] overflow-hidden rounded-2xl border-2 border-dashed border-emerald-200 bg-white shadow-inner">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #d1fae5 1px, transparent 1px), linear-gradient(to bottom, #d1fae5 1px, transparent 1px)',
                    backgroundSize: '85px 85px',
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-emerald-200/60" />
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-emerald-200/60" />
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="relative z-10 size-full touch-none cursor-crosshair"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerCancel={endDraw}
                />
              </div>
            </div>
          </>
        )}

        <div className="mb-4 flex items-center justify-center gap-4">
          <button onClick={() => move(-1)} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="이전 글자">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button onClick={resetCanvas} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="다시 쓰기">
            <RotateCcw size={20} className="text-gray-600" />
          </button>
          <button onClick={() => move(1)} className="rounded-xl bg-green-500 p-3 text-white shadow-md hover:bg-green-600" aria-label="다음 글자">
            <ChevronLeft size={20} className="rotate-180" />
          </button>
        </div>

        <div className="h-8 text-center text-sm font-semibold">
          {score === 100 && <span className="text-emerald-600">잘했어요!</span>}
          {score === 0 && <span className="text-amber-600">글자를 조금 더 써보세요.</span>}
        </div>
        <div className="text-center text-xs text-gray-400">{currentIndex + 1} / {itemCount}</div>
      </main>
    </div>
  )
}
