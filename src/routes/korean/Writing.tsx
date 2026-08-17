import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Eraser, PenTool, RotateCcw, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { jamoList } from '@/data/koreanJamo'
import { jamoStrokes } from '@/data/koreanStrokes'
import { useSpeech } from '@/hooks/useSpeech'
import { useSettingsStore } from '@/stores/settingsStore'
import { shuffle } from '@/lib/random'

type Mode = 'trace' | 'free'

const CANVAS_SIZE = 340
const LINE_WIDTH = 10
const GUIDE_COLOR = '#e0d4f5'
const DRAW_COLOR = '#7c3aed'
const STROKE_ORDER_COLOR = '#ec4899' // 획순 가이드 핑크색

// 자음 + 모음 + 가나다라...기본 글자 (자음×모음 조합)
const consonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const doubleConsonants = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']
const vowels = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']

// 자음별 기본 글자 조합 (가갸거겨고교구규그기, 나냐너녀노뇨누뉴느니, ...)
function buildJamoList(): string[] {
  const list: string[] = []
  // 먼저 자음 전체
  list.push(...consonants)
  // 쌍자음
  list.push(...doubleConsonants)
  // 모음 전체
  list.push(...vowels)
  // 자음×모음 조합
  const consonantCodes = [0, 2, 3, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18] // ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ
  const vowelCodes = [0, 2, 4, 6, 8, 12, 13, 17, 18, 20] // ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ
  for (const c of consonantCodes) {
    for (const v of vowelCodes) {
      list.push(String.fromCharCode(0xAC00 + c * 588 + v * 28))
    }
  }
  return list
}

const jamoFullList = buildJamoList()

// 6세 수준의 쉬운 한글 단어 (이모지 포함)
const wordListWithEmoji: { word: string; emoji: string }[] = [
  // 1글자
  { word: '빵', emoji: '🍞' }, { word: '물', emoji: '💧' }, { word: '집', emoji: '🏠' },
  { word: '밥', emoji: '🍚' }, { word: '책', emoji: '📖' }, { word: '손', emoji: '✋' },
  { word: '발', emoji: '🦶' }, { word: '눈', emoji: '👀' }, { word: '코', emoji: '👃' },
  { word: '입', emoji: '👄' }, { word: '귀', emoji: '👂' }, { word: '팔', emoji: '💪' },
  { word: '배', emoji: '🚢' }, { word: '꿀', emoji: '🍯' }, { word: '꽃', emoji: '🌸' },
  // 2글자
  { word: '엄마', emoji: '👩' }, { word: '아빠', emoji: '👨' }, { word: '하늘', emoji: '🌤️' },
  { word: '나무', emoji: '🌳' }, { word: '사랑', emoji: '❤️' }, { word: '바다', emoji: '🌊' },
  { word: '우리', emoji: '👨‍👩‍👧' }, { word: '가방', emoji: '🎒' }, { word: '나비', emoji: '🦋' },
  { word: '토끼', emoji: '🐰' }, { word: '사과', emoji: '🍎' }, { word: '포도', emoji: '🍇' },
  { word: '구름', emoji: '☁️' }, { word: '바람', emoji: '💨' }, { word: '꽃잎', emoji: '🌸' },
  { word: '별님', emoji: '⭐' }, { word: '달님', emoji: '🌙' }, { word: '해님', emoji: '☀️' },
  { word: '수박', emoji: '🍉' }, { word: '딸기', emoji: '🍓' }, { word: '우유', emoji: '🥛' },
  { word: '친구', emoji: '🧒' }, { word: '공부', emoji: '📖' }, { word: '기차', emoji: '🚂' },
  { word: '버스', emoji: '🚌' }, { word: '연필', emoji: '✏️' }, { word: '노래', emoji: '🎵' },
  { word: '그림', emoji: '🎨' }, { word: '과자', emoji: '🍪' }, { word: '라면', emoji: '🍜' },
  { word: '허리', emoji: '🧍' }, { word: '무릎', emoji: '🦵' }, { word: '어깨', emoji: '💪' },
  { word: '이름', emoji: '📝' }, { word: '다리', emoji: '🌉' }, { word: '머리', emoji: '👤' },
]

const SYLLABLE_SIZE = 140

// 한글 음절 분해 (초성 + 중성 + 종성)
const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
const JONGSEONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

function decompose(char: string): { cho: string; jung: string; jong: string } | null {
  const code = char.charCodeAt(0) - 0xAC00
  if (code < 0 || code > 11171) return null
  const cho = CHOSEONG[Math.floor(code / 588)]
  const jung = JUNGSEONG[Math.floor((code % 588) / 28)]
  const jong = JONGSEONG[code % 28]
  return { cho, jung, jong }
}

// 음절별 독립 캔버스 컴포넌트
function SyllableCanvas({ char, showGuide }: { char: string; showGuide: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [drawing, setDrawing] = useState(false)

  const drawGuide = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, SYLLABLE_SIZE, SYLLABLE_SIZE)
    if (showGuide) {
      ctx.save()
      ctx.font = `bold 100px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeStyle = GUIDE_COLOR
      ctx.lineWidth = 2.5
      ctx.setLineDash([5, 4])
      ctx.strokeText(char, SYLLABLE_SIZE / 2, SYLLABLE_SIZE / 2)
      ctx.fillStyle = GUIDE_COLOR
      ctx.globalAlpha = 0.25
      ctx.fillText(char, SYLLABLE_SIZE / 2, SYLLABLE_SIZE / 2)
      ctx.restore()
    }
  }, [char, showGuide])

  useEffect(() => { drawGuide() }, [drawGuide])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (SYLLABLE_SIZE / rect.width),
      y: (e.clientY - rect.top) * (SYLLABLE_SIZE / rect.height),
    }
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrawing(true)
    const pos = getPos(e)
    lastPoint.current = pos
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, LINE_WIDTH / 2, 0, Math.PI * 2)
      ctx.fillStyle = DRAW_COLOR
      ctx.fill()
    }
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !lastPoint.current) return
    e.preventDefault()
    const pos = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = DRAW_COLOR
      ctx.lineWidth = LINE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])
      ctx.stroke()
    }
    lastPoint.current = pos
  }

  const onUp = () => { setDrawing(false); lastPoint.current = null }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-violet-200 bg-white shadow-inner"
      style={{ width: SYLLABLE_SIZE, height: SYLLABLE_SIZE }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-violet-200/40" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-violet-200/40" />
      </div>
      <canvas
        ref={canvasRef}
        width={SYLLABLE_SIZE}
        height={SYLLABLE_SIZE}
        className="relative z-10 size-full touch-none cursor-crosshair"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  )
}

export default function Writing() {
  const { soundEnabled } = useSettingsStore()
  const { speak } = useSpeech()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [mode, setMode] = useState<Mode>('trace')
  const [showGuide, setShowGuide] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tab, setTab] = useState<'jamo' | 'word'>('jamo')
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [shuffledWords, setShuffledWords] = useState(() => shuffle([...wordListWithEmoji]))
  const [score, setScore] = useState<number | null>(null)
  const [scoreMessage, setScoreMessage] = useState('')
  const [passed, setPassed] = useState(false)
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentList = tab === 'jamo' ? jamoFullList : shuffledWords.map(w => w.word)
  const currentChar = currentList[currentIndex]
  const currentWordEntry = tab === 'word' ? shuffledWords[currentIndex] : undefined

  // 캔버스 초기화
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [])

  // 가이드 글자 그리기
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    if (mode === 'trace' && showGuide) {
      ctx.save()
      ctx.font = `bold ${currentChar.length > 1 ? 130 : 220}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // 점선 효과
      ctx.strokeStyle = GUIDE_COLOR
      ctx.lineWidth = 3
      ctx.setLineDash([6, 4])
      ctx.strokeText(currentChar, CANVAS_SIZE / 2, CANVAS_SIZE / 2)
      // 연한 채우기
      ctx.fillStyle = GUIDE_COLOR
      ctx.globalAlpha = 0.3
      ctx.fillText(currentChar, CANVAS_SIZE / 2, CANVAS_SIZE / 2)
      ctx.restore()

      // 획순 가이드 그리기
      const strokes = jamoStrokes[currentChar]
      if (strokes) {
        // 글자 크기에 맞게 스케일링 (220px 폰트가 340px 캔버스 중앙에 렌더링됨)
        const charSize = currentChar.length > 1 ? 130 : 200
        const offset = (CANVAS_SIZE - charSize) / 2
        const mapCoord = (v: number) => offset + v * charSize

        const labels: { x: number; y: number; startX: number; startY: number; number: number }[] = []

        ctx.save()
        strokes.forEach((stroke, idx) => {
          // 점선 경로
          ctx.beginPath()
          ctx.setLineDash([8, 6])
          ctx.strokeStyle = STROKE_ORDER_COLOR
          ctx.lineWidth = 4
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.globalAlpha = 0.35
          for (let i = 0; i < stroke.length; i++) {
            const x = mapCoord(stroke[i][0])
            const y = mapCoord(stroke[i][1])
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()

          // 시작점 주변의 빈 위치를 찾아 번호를 배치
          const startX = mapCoord(stroke[0][0])
          const startY = mapCoord(stroke[0][1])
          const nextX = stroke.length >= 2 ? mapCoord(stroke[1][0]) : startX
          const nextY = stroke.length >= 2 ? mapCoord(stroke[1][1]) : startY
          const direction = Math.atan2(nextY - startY, nextX - startX)
          const candidateAngles = [
            direction - Math.PI / 2,
            direction + Math.PI / 2,
            direction + Math.PI,
            direction - Math.PI / 4,
            direction + Math.PI / 4,
          ]
          const candidates = [20, 30, 40].flatMap((distance) =>
            candidateAngles.map((angle) => ({
              x: startX + Math.cos(angle) * distance,
              y: startY + Math.sin(angle) * distance,
            }))
          )
          const labelPosition = candidates.find((candidate) => {
            const insideCanvas = candidate.x >= 14 && candidate.x <= CANVAS_SIZE - 14
              && candidate.y >= 14 && candidate.y <= CANVAS_SIZE - 14
            const clearOfLabels = labels.every(
              (label) => Math.hypot(candidate.x - label.x, candidate.y - label.y) >= 27
            )
            return insideCanvas && clearOfLabels
          }) ?? { x: startX, y: startY }

          labels.push({
            ...labelPosition,
            startX,
            startY,
            number: idx + 1,
          })

          // 끝점에 화살표 표시
          const endX = mapCoord(stroke[stroke.length - 1][0])
          const endY = mapCoord(stroke[stroke.length - 1][1])
          // 화살표 방향 계산 (마지막 두 점 기준)
          const prevIdx = stroke.length >= 2 ? stroke.length - 2 : 0
          const prevX = mapCoord(stroke[prevIdx][0])
          const prevY = mapCoord(stroke[prevIdx][1])
          const angle = Math.atan2(endY - prevY, endX - prevX)
          const arrowSize = 10
          ctx.setLineDash([])
          ctx.globalAlpha = 0.4
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
          ctx.fillStyle = STROKE_ORDER_COLOR
          ctx.fill()
        })

        // 번호는 모든 가이드 위에 마지막으로 그려 선에 가려지지 않게 한다.
        labels.forEach((label) => {
          ctx.setLineDash([])
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = STROKE_ORDER_COLOR
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(label.startX, label.startY)
          ctx.lineTo(label.x, label.y)
          ctx.stroke()

          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(label.x, label.y, 13, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(label.x, label.y, 10.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(236, 72, 153, 0.5)'
          ctx.fill()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(label.number), label.x, label.y)
        })
        ctx.restore()
      }
    }
  }, [currentChar, mode, showGuide])

  useEffect(() => {
    drawGuide()
  }, [drawGuide])

  // 좌표 계산
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    // 새 입력 시작하면 채점 타이머 취소
    if (checkTimer.current) { clearTimeout(checkTimer.current); checkTimer.current = null }
    setIsDrawing(true)
    const pos = getPos(e)
    lastPoint.current = pos
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, LINE_WIDTH / 2, 0, Math.PI * 2)
      ctx.fillStyle = DRAW_COLOR
      ctx.fill()
    }
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    const pos = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && lastPoint.current) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = DRAW_COLOR
      ctx.lineWidth = LINE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])
      ctx.stroke()
    }
    lastPoint.current = pos
  }

  const endDraw = () => {
    setIsDrawing(false)
    lastPoint.current = null
    // 3초간 입력 없으면 자동 채점
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(() => {
      checkDrawingRef.current()
    }, 3000)
  }

  // 채점: 사용자가 그린 것과 목표 글자를 픽셀 비교
  const checkDrawing = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // 사용자가 그린 픽셀 추출
    const userImageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const userPixels = userImageData.data

    // 오프스크린 캔버스에 목표 글자 렌더
    const offscreen = document.createElement('canvas')
    offscreen.width = CANVAS_SIZE
    offscreen.height = CANVAS_SIZE
    const offCtx = offscreen.getContext('2d')!
    offCtx.font = `bold ${currentChar.length > 1 ? 130 : 220}px sans-serif`
    offCtx.textAlign = 'center'
    offCtx.textBaseline = 'middle'
    offCtx.fillStyle = '#000000'
    offCtx.fillText(currentChar, CANVAS_SIZE / 2, CANVAS_SIZE / 2)
    const targetImageData = offCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const targetPixels = targetImageData.data

    // 픽셀 비교 (알파 채널 기준)
    let targetCount = 0  // 목표 글자의 픽셀 수
    let overlapCount = 0 // 사용자가 목표 영역에 쓴 픽셀 수
    let userCount = 0    // 사용자가 쓴 전체 픽셀 수
    const threshold = 50

    for (let i = 3; i < targetPixels.length; i += 4) {
      const isTarget = targetPixels[i] > threshold
      // 사용자 픽셀: 가이드(연보라) 제외하고 실제 그린 색(보라)만 체크
      const r = userPixels[i - 3]
      const g = userPixels[i - 2]
      const b = userPixels[i - 1]
      const a = userPixels[i]
      // DRAW_COLOR: #7c3aed → r≈124, g≈58, b≈237
      const isUser = a > threshold && b > 150 && r > 50 && g < 150

      if (isTarget) targetCount++
      if (isUser) userCount++
      if (isTarget && isUser) overlapCount++
    }

    if (userCount === 0) {
      setScore(0)
      setScoreMessage('먼저 글자를 써보세요! ✏️')
      return
    }

    // 정확도: 목표 영역 커버율과 삐져나간 정도를 합산
    const coverage = targetCount > 0 ? overlapCount / targetCount : 0
    const precision = userCount > 0 ? overlapCount / userCount : 0
    const finalScore = Math.round((coverage * 0.6 + precision * 0.4) * 100)

    setScore(finalScore)
    if (finalScore >= 10) {
      setPassed(true)
      setScoreMessage('잘했어요! 👏')
      if (soundEnabled) speak('잘했어요!', 'ko-KR')
      // 1.2초 후 자동으로 다음 글자
      autoNextTimer.current = setTimeout(() => {
        nextCharRef.current()
      }, 1200)
    } else if (finalScore >= 10) {
      setScoreMessage('좋아요, 조금만 더! 💪')
    } else {
      setScoreMessage('다시 한번 써볼까요? 🤔')
    }
  }, [currentChar, soundEnabled, speak])

  const checkDrawingRef = useRef(checkDrawing)
  useEffect(() => { checkDrawingRef.current = checkDrawing }, [checkDrawing])

  const nextChar = useCallback(() => {
    if (autoNextTimer.current) {
      clearTimeout(autoNextTimer.current)
      autoNextTimer.current = null
    }
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
    let next = (currentIndex + 1) % currentList.length
    // 단어 탭에서 한 바퀴 돌면 다시 셔플
    if (tab === 'word' && next === 0) {
      setShuffledWords(shuffle([...wordListWithEmoji]))
    }
    setCurrentIndex(next)
    clearCanvas()
    setScore(null)
    setScoreMessage('')
    setPassed(false)
    if (soundEnabled) {
      const char = currentList[next]
      const jamo = jamoList.find((j) => j.char === char)
      speak(jamo ? jamo.name : char, 'ko-KR')
    }
  }, [currentIndex, currentList, tab, clearCanvas, soundEnabled, speak])

  // ref로 최신 nextChar를 참조 (타이머 콜백용)
  const nextCharRef = useRef(nextChar)
  useEffect(() => { nextCharRef.current = nextChar }, [nextChar])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
      if (checkTimer.current) clearTimeout(checkTimer.current)
    }
  }, [])

  const prevChar = () => {
    const prev = (currentIndex - 1 + currentList.length) % currentList.length
    setCurrentIndex(prev)
    clearCanvas()
    setScore(null)
    setScoreMessage('')
    setPassed(false)
  }

  const handleTabChange = (newTab: 'jamo' | 'word') => {
    setTab(newTab)
    setCurrentIndex(0)
    if (newTab === 'word') setShuffledWords(shuffle([...wordListWithEmoji]))
    clearCanvas()
    setScore(null)
    setScoreMessage('')
    setPassed(false)
  }

  const speakChar = () => {
    const jamo = jamoList.find((j) => j.char === currentChar)
    speak(jamo ? jamo.name : currentChar, 'ko-KR')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-purple-50/30 to-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/korean" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">글씨 쓰기</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-4 pb-8">
        {/* 탭: 자음모음 / 단어 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTabChange('jamo')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === 'jamo'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            자음/모음
          </button>
          <button
            onClick={() => handleTabChange('word')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === 'word'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            단어
          </button>
        </div>

        {tab === 'word' && currentWordEntry ? (
          /* ===== 단어 쓰기: 음절별 칸 ===== */
          <div>
            {/* 단어 표시 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentChar}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-5"
              >
                <button
                  onClick={speakChar}
                  className="mx-auto flex items-center gap-4 px-6 py-4 rounded-2xl bg-white shadow-sm border border-violet-100 hover:shadow-md transition-shadow"
                >
                  <span className="text-5xl">{currentWordEntry.emoji}</span>
                  <div className="flex gap-2">
                    {[...currentChar].map((ch, i) => (
                      <span key={i} className="text-4xl font-bold text-violet-700 bg-violet-50 rounded-xl w-14 h-14 flex items-center justify-center border border-violet-200">
                        {ch}
                      </span>
                    ))}
                  </div>
                  <span className="text-lg text-gray-400">🔊</span>
                </button>
              </motion.div>
            </AnimatePresence>

            {/* 받침 분해 표시 */}
            <div className="flex justify-center gap-4 mb-4">
              {[...currentChar].map((ch, i) => {
                const d = decompose(ch)
                if (!d) return null
                return (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <span className="font-bold text-violet-600">{d.cho}</span>
                    <span className="text-gray-400">+</span>
                    <span className="font-bold text-pink-500">{d.jung}</span>
                    {d.jong && (
                      <>
                        <span className="text-gray-400">+</span>
                        <span className="font-bold text-blue-500">{d.jong}</span>
                      </>
                    )}
                    <span className="text-gray-400 mx-0.5">→</span>
                    <span className="font-bold text-gray-700">{ch}</span>
                  </div>
                )
              })}
            </div>

            {/* 따라쓰기 칸 */}
            <div className="space-y-3 mb-5">
                <div className="flex justify-center gap-3">
                  {[...currentChar].map((ch, chIdx) => (
                    <SyllableCanvas
                      key={`${currentChar}-${chIdx}`}
                      char={ch}
                      showGuide={true}
                    />
                  ))}
                </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button onClick={prevChar} className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm" aria-label="이전">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button onClick={nextChar} className="p-3 rounded-xl bg-violet-600 text-white shadow-md hover:bg-violet-700" aria-label="다음">
                <ChevronNext size={20} />
              </button>
            </div>
          </div>
        ) : (
          /* ===== 자음/모음 쓰기: 기존 대형 캔버스 ===== */
          <div>

        {/* 모드 토글 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('trace')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'trace'
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <PenTool size={14} /> 따라쓰기
          </button>
          <button
            onClick={() => setMode('free')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'free'
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Eraser size={14} /> 자유쓰기
          </button>
        </div>

        {/* 현재 글자 표시 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChar}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center mb-3"
          >
            <button
              onClick={speakChar}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <span className="text-5xl font-bold text-violet-700">{currentChar}</span>
              {tab === 'jamo' && (
                <span className="text-lg text-gray-500">
                  {jamoList.find((j) => j.char === currentChar)?.name}
                </span>
              )}
              <span className="text-lg text-gray-400">🔊</span>
            </button>
          </motion.div>
        </AnimatePresence>

        {/* 캔버스 */}
        <div className="flex justify-center mb-4">
          <div className={`relative rounded-2xl border-2 border-dashed bg-white shadow-inner overflow-hidden transition-colors duration-300 ${
            passed ? 'border-green-400 ring-4 ring-green-100' : 'border-violet-200'
          }`}>
            {/* 격자 배경 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #f3e8ff 1px, transparent 1px),
                  linear-gradient(to bottom, #f3e8ff 1px, transparent 1px)
                `,
                backgroundSize: '85px 85px',
              }}
            />
            {/* 십자 가이드선 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-violet-200/50" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-violet-200/50" />
            </div>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="relative z-10 touch-none cursor-crosshair"
              style={{ width: '340px', height: '340px' }}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={prevChar}
            className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
            aria-label="이전"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => { clearCanvas(); drawGuide(); setScore(null); setScoreMessage(''); setPassed(false); if (checkTimer.current) { clearTimeout(checkTimer.current); checkTimer.current = null } }}
            className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
            aria-label="지우기"
          >
            <RotateCcw size={20} className="text-gray-600" />
          </button>

          {mode === 'trace' && (
            <button
              onClick={() => { setShowGuide(!showGuide); setTimeout(drawGuide, 0) }}
              className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
              aria-label={showGuide ? '가이드 숨기기' : '가이드 보기'}
            >
              {showGuide ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
            </button>
          )}
          <button
            onClick={nextChar}
            className="p-3 rounded-xl bg-violet-600 text-white shadow-md hover:bg-violet-700 transition-colors"
            aria-label="다음"
          >
            <ChevronNext size={20} />
          </button>
        </div>

        {/* 채점 결과 */}
        {score !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center mb-4 p-3 rounded-xl ${
              passed ? 'bg-green-50 border border-green-200' :
              score >= 30 ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}
          >
            <div className={`text-2xl font-bold mb-1 ${passed ? 'text-green-600' : ''}`}>
              {score}점
            </div>
            <div className="text-sm">{scoreMessage}</div>
          </motion.div>
        )}

          </div>
        )}

        {/* 진행 표시 */}
        <div className="text-center">
          <span className="text-xs text-gray-400">
            {currentIndex + 1} / {currentList.length}
          </span>
          <div className="mt-2 mx-auto max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet-500 rounded-full"
              animate={{ width: `${((currentIndex + 1) / currentList.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function ChevronNext({ size = 20 }: { size?: number }) {
  return <ChevronRight size={size} />
}
