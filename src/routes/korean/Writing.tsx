import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Eraser, PenTool, RotateCcw, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { jamoList } from '@/data/koreanJamo'
import { useSpeech } from '@/hooks/useSpeech'
import { useSettingsStore } from '@/stores/settingsStore'
import { shuffle } from '@/lib/random'

type Mode = 'trace' | 'free'

const CANVAS_SIZE = 340
const LINE_WIDTH = 10
const GUIDE_COLOR = '#e0d4f5'
const DRAW_COLOR = '#7c3aed'

// 자음 + 모음 + 가나다라...기본 글자 (자음×모음 조합)
const consonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const vowels = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']

// 자음별 기본 글자 조합 (가갸거겨고교구규그기, 나냐너녀노뇨누뉴느니, ...)
function buildJamoList(): string[] {
  const list: string[] = []
  // 먼저 자음 전체
  list.push(...consonants)
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

// 6세 수준의 쉬운 한글 단어
const wordList = [
  '엄마', '아빠', '하늘', '나무', '사랑', '바다', '우리', '이름',
  '가방', '나비', '다리', '토끼', '고양이', '강아지', '사과', '포도',
  '구름', '바람', '꽃잎', '별님', '달님', '해님', '물고기', '거북이',
  '호랑이', '코끼리', '기린', '판다', '수박', '딸기', '바나나', '우유',
  '빵', '물', '집', '밥', '책', '손', '발', '눈', '코', '입',
  '귀', '팔', '다리', '머리', '배꼽', '어깨', '무릎', '허리',
  '학교', '친구', '선생님', '공부', '놀이터', '미끄럼틀', '그네',
  '자전거', '비행기', '자동차', '기차', '버스', '배', '로켓',
  '연필', '지우개', '색연필', '크레파스', '가위', '풀', '종이',
  '피아노', '기타', '북', '노래', '춤', '그림', '만들기',
  '아이스크림', '초콜릿', '과자', '케이크', '주스', '라면',
  '봄', '여름', '가을', '겨울', '비', '눈', '무지개', '번개',
]

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
  const [shuffledWords, setShuffledWords] = useState(() => shuffle([...wordList]))
  const [score, setScore] = useState<number | null>(null)
  const [scoreMessage, setScoreMessage] = useState('')
  const [passed, setPassed] = useState(false)
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentList = tab === 'jamo' ? jamoFullList : shuffledWords
  const currentChar = currentList[currentIndex]

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
    }, 1000)
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
      // DRAW_COLOR는 #7c3aed → r≈124, g≈58, b≈237
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
      setShuffledWords(shuffle([...wordList]))
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
    if (newTab === 'word') setShuffledWords(shuffle([...wordList]))
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
