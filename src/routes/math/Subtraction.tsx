import { useState, useCallback, useRef } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore, subtractionRanges, type SubtractionDifficulty } from '@/stores/settingsStore'
import { useRecordsStore } from '@/stores/recordsStore'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'
import { Minus } from 'lucide-react'

function generateProblem(difficulty: SubtractionDifficulty) {
  const range = subtractionRanges[difficulty]
  let a = randInt(range.min, range.max)
  let b = randInt(range.min, range.max)
  // 큰 수에서 작은 수를 빼서 음수 방지
  if (a < b) [a, b] = [b, a]
  const answer = a - b
  const options = new Set<number>([answer])
  while (options.size < 6) {
    const wrong = randInt(0, range.max * 2)
    if (wrong !== answer) options.add(wrong)
  }
  return { a, b, answer, options: shuffle([...options]) }
}

export default function Subtraction() {
  const { subtractionDifficulty, timerEnabled, timerSeconds, soundEnabled } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('math/subtraction')
  const { updateStreak, getStreak } = useRecordsStore()
  const streakRef = useRef(0)
  const [bestStreak, setBestStreak] = useState(() => getStreak('math/subtraction'))
  const [problem, setProblem] = useState(() => generateProblem(subtractionDifficulty))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(subtractionDifficulty))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [subtractionDifficulty])

  const handleSelect = (opt: number) => {
    if (feedback) return
    if (opt === problem.answer) {
      if (soundEnabled) playCorrect()
      addCorrect()
      streakRef.current += 1
      if (updateStreak('math/subtraction', streakRef.current)) {
        setBestStreak(streakRef.current)
      }
      setFeedback('correct')
    } else {
      if (soundEnabled) playWrong()
      addWrong()
      streakRef.current = 0
      setFeedback('wrong')
    }
  }

  const handleTimeUp = () => {
    if (!feedback) {
      if (soundEnabled) playWrong()
      addWrong()
      streakRef.current = 0
      setFeedback('wrong')
    }
  }

  return (
    <GameLayout
      title="빼기"
      icon={Minus}
      iconGradient="from-rose-500 to-pink-600"
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
        {problem.a} − {problem.b} = ?
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid options={problem.options} onSelect={handleSelect} columns={3} />
      )}
    </GameLayout>
  )
}
