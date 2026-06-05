import { useState, useCallback } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore, type StepPatternSettings } from '@/stores/settingsStore'
import { Shapes } from 'lucide-react'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

function generateProblem(settings: StepPatternSettings, blankCount: number) {
  const { difficulty, maxNum } = settings
  const isEasy = difficulty === 'easy'
  const len = 5
  let step: number
  let start: number

  if (isEasy) {
    step = 5
    const maxStart = maxNum - step * (len - 1)
    start = (randInt(1, Math.max(1, Math.floor(maxStart / 5)))) * 5
  } else {
    const maxPossibleStep = Math.floor((maxNum - 1) / (len - 1))
    step = randInt(1, Math.min(9, maxPossibleStep))
    const maxStart = maxNum - step * (len - 1)
    start = randInt(1, Math.max(1, maxStart))
  }

  const seq = Array.from({ length: len }, (_, i) => start + i * step)

  // 빈칸 (처음/끝 제외)
  const blanks: number[] = []
  while (blanks.length < Math.min(blankCount, len - 2)) {
    const idx = randInt(1, len - 2)
    if (!blanks.includes(idx)) blanks.push(idx)
  }
  blanks.sort()

  const answers = blanks.map((i) => seq[i])
  blanks.forEach((i) => { seq[i] = -1 })

  // 매력적 오답 생성
  const optionSet = new Set<number>(answers)
  const first = answers[0]
  const distractors = [first + step, first - step, first + 1, first - 1, first + 2, first - 2]
  distractors.forEach((v) => {
    if (optionSet.size < Math.max(4, answers.length + 2) && v > 0 && !answers.includes(v)) {
      optionSet.add(v)
    }
  })
  while (optionSet.size < Math.max(4, answers.length + 2)) {
    optionSet.add(randInt(1, maxNum))
  }

  return { seq, blanks, answers, step, options: shuffle([...optionSet]) }
}

export default function Pattern() {
  const { stepPatternSettings, timerEnabled, timerSeconds, soundEnabled } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('math/pattern')
  const [problem, setProblem] = useState(() =>
    generateProblem(stepPatternSettings, stepPatternSettings.blankCount)
  )
  const [filled, setFilled] = useState<number[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(stepPatternSettings, stepPatternSettings.blankCount))
    setFilled([])
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [stepPatternSettings])

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

  const displaySeq = problem.seq.map((n, i) => {
    const blankOrder = problem.blanks.indexOf(i)
    if (blankOrder !== -1 && filled[blankOrder] !== undefined) return filled[blankOrder]
    return n
  })

  return (
    <GameLayout
      title="패턴채우기"
      icon={Shapes}
      iconGradient="from-indigo-500 to-violet-600"
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
        <p className="text-xs text-gray-400 text-center mb-3 font-medium">+{problem.step}씩 커져요</p>
        <div className="flex gap-3 items-center flex-wrap justify-center">
          {displaySeq.map((n, i) => {
            const isBlank = problem.blanks.includes(i)
            const blankOrder = problem.blanks.indexOf(i)
            const isFilled = isBlank && filled[blankOrder] !== undefined
            const isNext = isBlank && blankOrder === filled.length
            return (
              <div
                key={i}
                className={`w-16 h-16 flex items-center justify-center rounded-xl text-2xl font-bold ${
                  isBlank && !isFilled
                    ? isNext
                      ? 'bg-orange-300 border-2 border-orange-500 text-orange-700 animate-pulse'
                      : 'bg-orange-200 border-2 border-orange-400 text-orange-600'
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
