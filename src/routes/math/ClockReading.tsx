import { useState, useCallback } from 'react'
import GameLayout from '@/components/game/GameLayout'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore } from '@/stores/settingsStore'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'
import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export type ClockDifficulty = 'easy' | 'normal' | 'hard'

// 난이도별 분 단위
const minuteOptions: Record<ClockDifficulty, number[]> = {
  easy: [0],                                    // 정각만
  normal: [0, 30],                              // 30분 단위
  hard: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], // 5분 단위
}

function generateProblem(difficulty: ClockDifficulty) {
  const hour = randInt(1, 12)
  const mins = minuteOptions[difficulty]
  const minute = mins[randInt(0, mins.length - 1)]
  const answer = formatTime(hour, minute)

  const options = new Set<string>([answer])
  while (options.size < 4) {
    const wH = randInt(1, 12)
    const wM = mins[randInt(0, mins.length - 1)]
    const wrong = formatTime(wH, wM)
    if (wrong !== answer) options.add(wrong)
  }

  return { hour, minute, answer, options: shuffle([...options]) }
}

function formatTime(h: number, m: number) {
  return `${h}:${String(m).padStart(2, '0')}`
}

// 아날로그 시계 SVG
function AnalogClock({ hour, minute }: { hour: number; minute: number }) {
  const cx = 100
  const cy = 100
  const r = 80

  // 시침: 시 + 분/60 → 360도 / 12
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90
  const hourRad = (hourAngle * Math.PI) / 180
  const hourLen = 38
  const hx = cx + hourLen * Math.cos(hourRad)
  const hy = cy + hourLen * Math.sin(hourRad)

  // 분침: 분 → 360도 / 60
  const minAngle = minute * 6 - 90
  const minRad = (minAngle * Math.PI) / 180
  const minLen = 62
  const mx = cx + minLen * Math.cos(minRad)
  const my = cy + minLen * Math.sin(minRad)

  return (
    <svg viewBox="0 0 200 200" className="w-72 h-72 drop-shadow-lg">
      {/* 시계 배경 */}
      <circle cx={cx} cy={cy} r={r + 8} fill="white" stroke="#e5e7eb" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#c7d2fe" strokeWidth={2} />

      {/* 숫자 */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1
        const angle = (num * 30 - 90) * (Math.PI / 180)
        const nx = cx + (r - 24) * Math.cos(angle)
        const ny = cy + (r - 24) * Math.sin(angle)
        return (
          <text
            key={num}
            x={nx}
            y={ny}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[17px] font-extrabold fill-gray-700"
          >
            {num}
          </text>
        )
      })}

      {/* 눈금 */}
      {Array.from({ length: 60 }, (_, i) => {
        const angle = (i * 6 - 90) * (Math.PI / 180)
        const isHour = i % 5 === 0
        const inner = r - (isHour ? 10 : 5)
        const outer = r - 2
        return (
          <line
            key={i}
            x1={cx + inner * Math.cos(angle)}
            y1={cy + inner * Math.sin(angle)}
            x2={cx + outer * Math.cos(angle)}
            y2={cy + outer * Math.sin(angle)}
            stroke={isHour ? '#6366f1' : '#d1d5db'}
            strokeWidth={isHour ? 2 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {/* 시침 - 옅은 파랑 */}
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#60a5fa" strokeWidth={7} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={5} fill="#60a5fa" />

      {/* 분침 - 옅은 빨강 */}
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#f87171" strokeWidth={3.5} strokeLinecap="round" />
      <polygon
        points={(() => {
          const tipLen = 8
          const tipWidth = 4
          const perpRad = minRad + Math.PI / 2
          const tx = mx + tipLen * Math.cos(minRad)
          const ty = my + tipLen * Math.sin(minRad)
          const lx = mx - tipWidth * Math.cos(perpRad)
          const ly = my - tipWidth * Math.sin(perpRad)
          const rx = mx + tipWidth * Math.cos(perpRad)
          const ry = my + tipWidth * Math.sin(perpRad)
          return `${tx},${ty} ${lx},${ly} ${rx},${ry}`
        })()}
        fill="#f87171"
      />

      {/* 중심점 */}
      <circle cx={cx} cy={cy} r={5} fill="#374151" />
      <circle cx={cx} cy={cy} r={2.5} fill="white" />
    </svg>
  )
}

export default function ClockReading() {
  const { timerEnabled, timerSeconds, soundEnabled, clockDifficulty } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('math/clock')
  const [problem, setProblem] = useState(() => generateProblem(clockDifficulty))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(clockDifficulty))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [clockDifficulty])

  const handleSelect = (opt: string) => {
    if (feedback) return
    if (opt === problem.answer) {
      if (soundEnabled) playCorrect()
      addCorrect()
      setFeedback('correct')
    } else {
      if (soundEnabled) playWrong()
      addWrong()
      setFeedback('wrong')
    }
  }

  const handleTimeUp = () => {
    if (!feedback) {
      if (soundEnabled) playWrong()
      addWrong()
      setFeedback('wrong')
    }
  }

  return (
    <GameLayout
      title="시계 보기"
      icon={Clock}
      iconGradient="from-amber-500 to-orange-600"
      backTo="/math"
      backLabel="수학"
      score={score}
      total={total}
      timerEnabled={timerEnabled}
      timerSeconds={timerSeconds}
      timerKey={timerKey}
      onTimeUp={handleTimeUp}
    >
      <motion.div
        key={timerKey}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="mb-6"
      >
        <AnalogClock hour={problem.hour} minute={problem.minute} />
      </motion.div>

      <p className="text-lg font-semibold text-gray-500 mb-4">지금 몇 시일까요?</p>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <div className="flex flex-wrap gap-3 w-full max-w-md mx-auto justify-center">
          {problem.options.map((opt, i) => (
            <motion.button
              key={opt}
              onClick={() => handleSelect(opt)}
              className="w-[calc(50%-6px)] group relative flex items-center justify-center rounded-2xl bg-white border border-gray-200/80 p-4 text-xl font-bold text-gray-700 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] transition-all min-h-[56px]"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.93 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all rounded-2xl" />
              <span className="relative z-10 font-mono tracking-wider text-2xl">{opt}</span>
            </motion.button>
          ))}
        </div>
      )}
    </GameLayout>
  )
}
