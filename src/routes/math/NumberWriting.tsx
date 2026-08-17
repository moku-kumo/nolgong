import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, RotateCcw, Volume2 } from 'lucide-react'
import { numberStrokes } from '@/data/numberStrokes'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSpeech } from '@/hooks/useSpeech'

type Mode = 'basic' | 'hundreds'

const CANVAS_SIZE = 340
const DIGIT_SIZE = 280
const DRAW_COLOR = '#7c3aed'
const GUIDE_COLOR = '#93c5fd'
const STROKE_GUIDE_COLOR = '#ec4899'
const basicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const hundredNumbers = Array.from({ length: 100 }, (_, i) => String(i + 1))

function countDrawnPixels(canvas: HTMLCanvasElement) {
  const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data
  if (!pixels) return 0
  let count = 0
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    if (pixels[index + 3] > 50 && blue > 150 && red > 50 && green < 150) count++
  }
  return count
}

// 자릿수별 독립 캔버스
function DigitCanvas({ char }: { char: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [drawing, setDrawing] = useState(false)

  const drawGuide = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, DIGIT_SIZE, DIGIT_SIZE)
    ctx.save()
    ctx.font = `bold 200px "Trebuchet MS", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = GUIDE_COLOR
    ctx.lineWidth = 4
    ctx.globalAlpha = 0.55
    ctx.setLineDash([8, 6])
    ctx.strokeText(char, DIGIT_SIZE / 2, DIGIT_SIZE / 2)
    ctx.fillStyle = GUIDE_COLOR
    ctx.globalAlpha = 0.1
    ctx.fillText(char, DIGIT_SIZE / 2, DIGIT_SIZE / 2)
    ctx.restore()
  }, [char])

  useEffect(() => { drawGuide() }, [drawGuide])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (DIGIT_SIZE / rect.width),
      y: (e.clientY - rect.top) * (DIGIT_SIZE / rect.height),
    }
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrawing(true)
    const pos = getPos(e)
    lastPoint.current = pos
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) { ctx.beginPath(); ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2); ctx.fillStyle = DRAW_COLOR; ctx.fill() }
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !lastPoint.current) return
    e.preventDefault()
    const pos = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath(); ctx.moveTo(lastPoint.current.x, lastPoint.current.y); ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = DRAW_COLOR; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.stroke()
    }
    lastPoint.current = pos
  }

  const onUp = () => { setDrawing(false); lastPoint.current = null }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-white shadow-inner"
      style={{ width: DIGIT_SIZE, height: DIGIT_SIZE }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-200/40" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-200/40" />
      </div>
      <canvas ref={canvasRef} width={DIGIT_SIZE} height={DIGIT_SIZE}
        className="relative z-10 size-full touch-none cursor-crosshair"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
    </div>
  )
}

export default function NumberWriting() {
  const { soundEnabled } = useSettingsStore()
  const { speak } = useSpeech()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hundredsContainerRef = useRef<HTMLDivElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAdvancingRef = useRef(false)
  const targetVersionRef = useRef(0)
  const [mode, setMode] = useState<Mode>('basic')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const list = mode === 'basic' ? basicNumbers : hundredNumbers
  const target = list[currentIndex]

  // 처음 로드 시 및 숫자 변경 시 TTS 재생
  useEffect(() => {
    targetVersionRef.current += 1
    isAdvancingRef.current = false
    if (soundEnabled) speak(target, 'ko-KR')
  }, [target, soundEnabled, speak])

  useEffect(() => () => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
  }, [])

  const drawGuide = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const strokes = numberStrokes[target] ?? []
    if (strokes.length === 0) {
      ctx.save()
      ctx.font = `bold 230px "Trebuchet MS", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeStyle = GUIDE_COLOR
      ctx.lineWidth = 4
      ctx.globalAlpha = 0.55
      ctx.setLineDash([8, 7])
      ctx.strokeText(target, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8)
      ctx.fillStyle = GUIDE_COLOR
      ctx.globalAlpha = 0.1
      ctx.fillText(target, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8)
      ctx.restore()
    }

    // 획순 가이드
    const guideSize = 230
    const guideOffset = (CANVAS_SIZE - guideSize) / 2
    const mapCoord = (value: number) => guideOffset + value * guideSize
    const labels: { x: number; y: number; startX: number; startY: number; number: number }[] = []

    ctx.save()
    strokes.forEach((stroke, index) => {
      const guidePoints = stroke.map(([x, y]) => ({ x: mapCoord(x), y: mapCoord(y) }))
      if (strokes.length > 1 && guidePoints.length >= 2) {
        const pointToSegmentDistance = (
          point: [number, number],
          segmentStart: [number, number],
          segmentEnd: [number, number],
        ) => {
          const dx = segmentEnd[0] - segmentStart[0]
          const dy = segmentEnd[1] - segmentStart[1]
          const lengthSquared = dx * dx + dy * dy
          if (lengthSquared === 0) {
            return Math.hypot(point[0] - segmentStart[0], point[1] - segmentStart[1])
          }
          const projection = Math.max(0, Math.min(1,
            ((point[0] - segmentStart[0]) * dx + (point[1] - segmentStart[1]) * dy)
              / lengthSquared
          ))
          return Math.hypot(
            point[0] - (segmentStart[0] + projection * dx),
            point[1] - (segmentStart[1] + projection * dy),
          )
        }
        const endpointIsShared = (point: [number, number]) => strokes.some(
          (otherStroke, otherIndex) => otherIndex !== index && otherStroke.some(
            (_, pointIndex) => pointIndex > 0 && pointToSegmentDistance(
              point,
              otherStroke[pointIndex - 1],
              otherStroke[pointIndex],
            ) < 0.015
          )
        )
        const insetEndpoint = (
          point: { x: number; y: number },
          neighbor: { x: number; y: number },
        ) => {
          const length = Math.hypot(neighbor.x - point.x, neighbor.y - point.y)
          if (length === 0) return point
          const inset = Math.min(16, length * 0.25)
          return {
            x: point.x + ((neighbor.x - point.x) / length) * inset,
            y: point.y + ((neighbor.y - point.y) / length) * inset,
          }
        }
        if (endpointIsShared(stroke[0])) {
          guidePoints[0] = insetEndpoint(guidePoints[0], guidePoints[1])
        }
        const lastIndex = guidePoints.length - 1
        if (endpointIsShared(stroke[lastIndex])) {
          guidePoints[lastIndex] = insetEndpoint(guidePoints[lastIndex], guidePoints[lastIndex - 1])
        }
      }

      // 채움 영역과 획순선이 동일한 경로를 사용한다.
      ctx.beginPath()
      ctx.setLineDash([])
      ctx.strokeStyle = GUIDE_COLOR
      ctx.lineWidth = 24
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 0.22
      for (let i = 0; i < guidePoints.length; i++) {
        if (i === 0) ctx.moveTo(guidePoints[i].x, guidePoints[i].y)
        else ctx.lineTo(guidePoints[i].x, guidePoints[i].y)
      }
      ctx.stroke()

      ctx.beginPath()
      ctx.setLineDash([7, 5])
      ctx.strokeStyle = GUIDE_COLOR
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.7
      for (let i = 0; i < guidePoints.length; i++) {
        if (i === 0) ctx.moveTo(guidePoints[i].x, guidePoints[i].y)
        else ctx.lineTo(guidePoints[i].x, guidePoints[i].y)
      }
      ctx.stroke()

      ctx.globalAlpha = 0.35
      ctx.strokeStyle = STROKE_GUIDE_COLOR
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      for (let i = 0; i < guidePoints.length; i++) {
        if (i === 0) ctx.moveTo(guidePoints[i].x, guidePoints[i].y)
        else ctx.lineTo(guidePoints[i].x, guidePoints[i].y)
      }
      ctx.stroke()

      const startX = guidePoints[0].x
      const startY = guidePoints[0].y
      const endX = guidePoints[guidePoints.length - 1].x
      const endY = guidePoints[guidePoints.length - 1].y
      const prevIdx = guidePoints.length >= 2 ? guidePoints.length - 2 : 0
      const prevX = guidePoints[prevIdx].x
      const prevY = guidePoints[prevIdx].y
      const angle = Math.hypot(endX - prevX, endY - prevY) < 4
        ? Math.PI
        : Math.atan2(endY - prevY, endX - prevX)

      const direction = Math.atan2(
        (guidePoints[1]?.y ?? startY) - startY,
        (guidePoints[1]?.x ?? startX) - startX
      )
      const candidateAngles = [direction - Math.PI / 2, direction + Math.PI / 2, direction + Math.PI]
      const anchorX = startX + ((guidePoints[1]?.x ?? startX) - startX) * 0.12
      const anchorY = startY + ((guidePoints[1]?.y ?? startY) - startY) * 0.12
      const candidates = [16, 26, 36, 46].flatMap((distance) =>
        candidateAngles.map((a) => ({
          x: anchorX + Math.cos(a) * distance,
          y: anchorY + Math.sin(a) * distance,
        }))
      )
      const position = candidates.find((c) => {
        const inside = c.x >= 14 && c.x <= CANVAS_SIZE - 14 && c.y >= 14 && c.y <= CANVAS_SIZE - 14
        return inside && labels.every((l) => Math.hypot(c.x - l.x, c.y - l.y) >= 30)
      }) ?? { x: startX, y: startY }

      labels.push({ ...position, startX: anchorX, startY: anchorY, number: index + 1 })

      const arrowSize = 14
      ctx.globalAlpha = 0.4
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fillStyle = STROKE_GUIDE_COLOR
      ctx.fill()
    })

    labels.forEach((label) => {
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.arc(label.startX, label.startY, 4, 0, Math.PI * 2)
      ctx.fillStyle = STROKE_GUIDE_COLOR
      ctx.fill()

      ctx.beginPath()
      ctx.arc(label.x, label.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.fill()
      ctx.strokeStyle = STROKE_GUIDE_COLOR
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = STROKE_GUIDE_COLOR
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(label.number), label.x, label.y)
    })
    ctx.restore()
  }, [target])

  useEffect(() => { drawGuide() }, [drawGuide])

  const getPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (event.clientY - rect.top) * (CANVAS_SIZE / rect.height),
    }
  }

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (isAdvancingRef.current) return
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getPosition(event)
    setIsDrawing(true)
    setScore(null)
    lastPoint.current = point
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5.5, 0, Math.PI * 2)
      ctx.fillStyle = DRAW_COLOR
      ctx.fill()
    }
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
      ctx.lineWidth = 11
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])
      ctx.stroke()
    }
    lastPoint.current = point
  }

  const handlePassed = useCallback((expectedVersion: number) => {
    if (expectedVersion !== targetVersionRef.current) return
    if (isAdvancingRef.current) return
    isAdvancingRef.current = true
    setScore(100)
    autoNextTimer.current = setTimeout(() => {
      if (expectedVersion !== targetVersionRef.current) return
      setCurrentIndex((index) => (index + 1) % list.length)
      setScore(null)
    }, 900)
  }, [list.length])

  const checkBasicDrawing = useCallback((expectedVersion: number) => {
    if (expectedVersion !== targetVersionRef.current || isAdvancingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (countDrawnPixels(canvas) > 250) handlePassed(expectedVersion)
    else setScore(0)
  }, [handlePassed])

  const endDraw = () => {
    setIsDrawing(false)
    lastPoint.current = null
    const expectedVersion = targetVersionRef.current
    checkTimer.current = setTimeout(() => checkBasicDrawing(expectedVersion), 1200)
  }

  const scheduleHundredsCheck = () => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
    setScore(null)
    const expectedVersion = targetVersionRef.current
    checkTimer.current = setTimeout(() => {
      if (expectedVersion !== targetVersionRef.current || isAdvancingRef.current) return
      const canvases = [...(hundredsContainerRef.current?.querySelectorAll('canvas') ?? [])]
      const passed = canvases.length > 0 && canvases.every((canvas) => countDrawnPixels(canvas) > 200)
      if (passed) handlePassed(expectedVersion)
      else setScore(0)
    }, 1200)
  }

  const move = (direction: -1 | 1) => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
    isAdvancingRef.current = false
    setCurrentIndex((i) => (i + direction + list.length) % list.length)
    setScore(null)
  }

  const changeMode = (newMode: Mode) => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
    isAdvancingRef.current = false
    setMode(newMode)
    setCurrentIndex(0)
    setScore(null)
  }

  const speakNumber = () => {
    if (soundEnabled) speak(target, 'ko-KR')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50/30 to-slate-50">
      <header className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-lg items-center justify-between px-5">
          <Link to="/math" className="-ml-2 rounded-xl p-2.5 transition-colors hover:bg-gray-100/80" aria-label="수학으로 돌아가기">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">숫자 쓰기</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-10 pt-5">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button onClick={() => changeMode('basic')}
            className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${mode === 'basic' ? 'bg-blue-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600'}`}>
            0~9
          </button>
          <button onClick={() => changeMode('hundreds')}
            className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${mode === 'hundreds' ? 'bg-blue-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600'}`}>
            1~100
          </button>
        </div>

        {mode === 'hundreds' ? (
          /* 1~100 모드: 자릿수별 칸 */
          <div>
            <motion.button key={target} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={speakNumber}
              className="mx-auto mb-5 flex items-center gap-4 px-6 py-4 rounded-2xl bg-white shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
              <span className="text-5xl font-bold text-blue-600">{target}</span>
              <Volume2 size={20} className="text-blue-500" />
            </motion.button>

            <div
              ref={hundredsContainerRef}
              onPointerUp={scheduleHundredsCheck}
              onPointerCancel={scheduleHundredsCheck}
              className="flex justify-center gap-3 mb-6"
            >
              {[...target].map((digit, i) => (
                <DigitCanvas key={`${target}-${i}`} char={digit} />
              ))}
            </div>

            <div className="mb-4 flex items-center justify-center gap-4">
              <button onClick={() => move(-1)} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="이전 숫자">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button onClick={() => move(1)} className="rounded-xl bg-blue-600 p-3 text-white shadow-md hover:bg-blue-700" aria-label="다음 숫자">
                <ChevronLeft size={20} className="rotate-180" />
              </button>
            </div>
          </div>
        ) : (
          /* 0~9 모드: 큰 캔버스 + 획순 */
          <div>
        <motion.button
          key={target}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={speakNumber}
          className="mb-4 flex min-h-20 w-full items-center justify-center gap-4 rounded-xl border border-blue-100 bg-white px-5 py-3 shadow-sm"
        >
          <span className="text-5xl font-bold text-blue-600">{target}</span>
          <Volume2 size={20} className="text-blue-500" />
        </motion.button>

        <div className="mb-6 flex justify-center">
          <div className="relative aspect-square w-full max-w-[340px] overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-white shadow-inner">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(to right, #dbeafe 1px, transparent 1px), linear-gradient(to bottom, #dbeafe 1px, transparent 1px)',
                backgroundSize: '85px 85px',
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-blue-200/60" />
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-blue-200/60" />
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

        <div className="mb-4 flex items-center justify-center gap-4">
          <button onClick={() => move(-1)} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="이전 숫자">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button onClick={() => { drawGuide() }} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="다시 쓰기">
            <RotateCcw size={20} className="text-gray-600" />
          </button>
          <button onClick={() => move(1)} className="rounded-xl bg-blue-600 p-3 text-white shadow-md hover:bg-blue-700" aria-label="다음 숫자">
            <ChevronLeft size={20} className="rotate-180" />
          </button>
        </div>

        <div className="text-center text-xs text-gray-400">{currentIndex + 1} / {list.length}</div>
          </div>
        )}

        <div className="mt-3 h-8 text-center text-sm font-semibold">
          {score === 100 && <span className="text-emerald-600">잘했어요! 다음 숫자로 넘어갈게요.</span>}
          {score === 0 && <span className="text-amber-600">숫자를 조금 더 써보세요.</span>}
        </div>
      </main>
    </div>
  )
}
