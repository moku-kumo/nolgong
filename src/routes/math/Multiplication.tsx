import { useState, useCallback } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore } from '@/stores/settingsStore'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'
import { X } from 'lucide-react'

export type MultiplicationDifficulty = 'easy' | 'normal' | 'hard'

const multiplicationRanges = {
  easy: { minDan: 2, maxDan: 5, minMul: 1, maxMul: 9 },
  normal: { minDan: 2, maxDan: 9, minMul: 1, maxMul: 9 },
  hard: { minDan: 2, maxDan: 9, minMul: 2, maxMul: 12 },
} as const

function generateProblem(difficulty: MultiplicationDifficulty) {
  const range = multiplicationRanges[difficulty]
  const a = randInt(range.minDan, range.maxDan)
  const b = randInt(range.minMul, range.maxMul)
  const answer = a * b
  const options = new Set<number>([answer])
  while (options.size < 6) {
    // 그럴듯한 오답 생성: 같은 단의 다른 값 또는 인접 단
    const wrongA = randInt(range.minDan, range.maxDan)
    const wrongB = randInt(range.minMul, range.maxMul)
    const wrong = wrongA * wrongB
    if (wrong !== answer) options.add(wrong)
  }
  return { a, b, answer, options: shuffle([...options]) }
}

export default function Multiplication() {
  const { multiplicationDifficulty, timerEnabled, timerSeconds, soundEnabled } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('math/multiplication')
  const [problem, setProblem] = useState(() => generateProblem(multiplicationDifficulty))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(multiplicationDifficulty))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [multiplicationDifficulty])

  const handleSelect = (opt: number) => {
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
      title="곱하기"
      icon={X}
      iconGradient="from-purple-500 to-pink-600"
      backTo="/math"
      backLabel="수학"
      score={score}
      total={total}
      timerEnabled={timerEnabled}
      timerSeconds={timerSeconds}
      timerKey={timerKey}
      onTimeUp={handleTimeUp}
    >
      <div className="text-6xl font-bold text-gray-700 mb-4">
        {problem.a} × {problem.b} = ?
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid options={problem.options} onSelect={handleSelect} columns={3} />
      )}
    </GameLayout>
  )
}
