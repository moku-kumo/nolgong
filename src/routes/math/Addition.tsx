import { useState, useCallback } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore, additionRanges, type AdditionDifficulty } from '@/stores/settingsStore'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'
import { Plus } from 'lucide-react'

function generateProblem(difficulty: AdditionDifficulty) {
  const range = additionRanges[difficulty]
  const a = randInt(range.min, range.max)
  const b = randInt(range.min, range.max)
  const answer = a + b
  const options = new Set<number>([answer])
  while (options.size < 6) {
    const wrong = randInt(0, range.max * 3)
    if (wrong !== answer) options.add(wrong)
  }
  return { a, b, answer, options: shuffle([...options]) }
}

export default function Addition() {
  const { additionDifficulty, timerEnabled, timerSeconds, soundEnabled } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('math/addition')
  const [problem, setProblem] = useState(() => generateProblem(additionDifficulty))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(additionDifficulty))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [additionDifficulty])

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
      title="더하기"
      icon={Plus}
      iconGradient="from-blue-500 to-indigo-600"
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
        {problem.a} + {problem.b} = ?
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid options={problem.options} onSelect={handleSelect} columns={3} />
      )}
    </GameLayout>
  )
}
