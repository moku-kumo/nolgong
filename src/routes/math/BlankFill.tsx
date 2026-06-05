import { useState, useCallback } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore, type PatternSettings } from '@/stores/settingsStore'
import { PenLine } from 'lucide-react'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

function generateProblem(settings: PatternSettings) {
  const { minNum, maxNum, blankCount } = settings
  const len = 5
  const start = randInt(minNum, Math.max(minNum, maxNum - len + 1))
  const seq = Array.from({ length: len }, (_, i) => start + i)

  // 빈칸 위치 (처음과 끝 제외)
  const blanks: number[] = []
  while (blanks.length < Math.min(blankCount, len - 2)) {
    const idx = randInt(1, len - 2)
    if (!blanks.includes(idx)) blanks.push(idx)
  }
  blanks.sort()

  const answers = blanks.map((i) => seq[i])
  blanks.forEach((i) => { seq[i] = -1 })

  // 옵션: 모든 정답 + 오답
  const optionSet = new Set<number>(answers)
  while (optionSet.size < Math.max(3, answers.length + 2)) {
    const wrong = randInt(Math.max(1, start - 3), start + len + 3)
    if (!seq.includes(wrong) && !answers.includes(wrong)) optionSet.add(wrong)
  }

  return { seq, blanks, answers, currentBlank: 0, options: shuffle([...optionSet]) }
}

export default function BlankFill() {
  const { patternSettings, timerEnabled, timerSeconds, soundEnabled } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('math/blank')
  const [problem, setProblem] = useState(() => generateProblem(patternSettings))
  const [filled, setFilled] = useState<number[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(patternSettings))
    setFilled([])
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [patternSettings])

  const handleSelect = (opt: number) => {
    if (feedback) return
    const newFilled = [...filled, opt]
    setFilled(newFilled)

    if (newFilled.length === problem.answers.length) {
      const allCorrect = problem.answers.every((a, i) => a === newFilled[i])
      if (allCorrect) {
        if (soundEnabled) playCorrect()
        addCorrect()
        setFeedback('correct')
      } else {
        if (soundEnabled) playWrong()
        addWrong()
        setFeedback('wrong')
      }
    }
  }

  const handleTimeUp = () => {
    if (!feedback) {
      if (soundEnabled) playWrong()
      addWrong()
      setFeedback('wrong')
    }
  }

  // 현재 표시할 수열 (채워진 빈칸 반영)
  const displaySeq = problem.seq.map((n, i) => {
    const blankOrder = problem.blanks.indexOf(i)
    if (blankOrder !== -1 && filled[blankOrder] !== undefined) {
      return filled[blankOrder]
    }
    return n
  })

  return (
    <GameLayout
      title="빈칸채우기"
      icon={PenLine}
      iconGradient="from-sky-500 to-blue-600"
      backTo="/math"
      backLabel="수학"
      score={score}
      total={total}
      timerEnabled={timerEnabled}
      timerSeconds={timerSeconds}
      timerKey={timerKey}
      onTimeUp={handleTimeUp}
    >
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <p className="text-xs text-gray-400 text-center mb-3 font-medium">문제</p>
        <div className="flex gap-3 items-center flex-wrap justify-center">
          {displaySeq.map((n, i) => {
            const isBlank = problem.blanks.includes(i)
            const blankOrder = problem.blanks.indexOf(i)
            const isFilled = isBlank && filled[blankOrder] !== undefined
            const isNext = isBlank && blankOrder === filled.length
            return (
              <div
                key={i}
                className={`w-14 h-14 flex items-center justify-center rounded-xl text-2xl font-bold ${
                  isBlank && !isFilled
                    ? isNext
                      ? 'bg-yellow-300 border-2 border-yellow-500 text-yellow-700 animate-pulse'
                      : 'bg-yellow-200 border-2 border-yellow-400 text-yellow-600'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                {n === -1 ? '?' : n}
              </div>
            )
          })}
        </div>
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid options={problem.options} onSelect={handleSelect} columns={4} />
      )}
    </GameLayout>
  )
}
