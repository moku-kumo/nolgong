import { useState, useCallback, useEffect } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { ALargeSmall } from 'lucide-react'
import { useSettingsStore, type AlphabetMode } from '@/stores/settingsStore'
import { alphabet } from '@/data/alphabet'
import { randInt, shuffle } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'
import { useSpeech } from '@/hooks/useSpeech'

function generateProblem(mode: AlphabetMode) {
  const idx = randInt(0, 25)
  const upper = alphabet.upper[idx]
  const lower = alphabet.lower[idx]
  const isUpperToLower =
    mode === 'upperToLower' ? true : mode === 'lowerToUpper' ? false : Math.random() > 0.5
  const question = isUpperToLower ? upper : lower
  const answer = isUpperToLower ? lower : upper

  const pool = isUpperToLower ? alphabet.lower : alphabet.upper
  const options = new Set<string>([answer])
  while (options.size < 4) {
    options.add(pool[randInt(0, 25)])
  }

  return { question, answer, isUpperToLower, options: shuffle([...options]) }
}

export default function Alphabet() {
  const { timerEnabled, timerSeconds, soundEnabled, englishSettings } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('english/alphabet')
  const { speak } = useSpeech()
  const [problem, setProblem] = useState(() => generateProblem(englishSettings.alphabetMode))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  // 문제가 바뀔 때 알파벳 발음 재생
  useEffect(() => {
    speak(problem.question, 'en-US', 0.8)
  }, [problem.question, speak])

  const next = useCallback(() => {
    setProblem(generateProblem(englishSettings.alphabetMode))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [englishSettings.alphabetMode])

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
      title="알파벳"
      icon={ALargeSmall}
      iconGradient="from-emerald-500 to-teal-600"
      backTo="/english"
      backLabel="영어"
      score={score}
      total={total}
      timerEnabled={timerEnabled}
      timerSeconds={timerSeconds}
      timerKey={timerKey}
      onTimeUp={handleTimeUp}
    >
      <div className="text-center mb-4">
        <p className="text-sm text-gray-400 mb-1">
          {problem.isUpperToLower ? '소문자를 찾아요!' : '대문자를 찾아요!'}
        </p>
        <div className="text-8xl font-bold text-indigo-500">{problem.question}</div>
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid options={problem.options} onSelect={handleSelect} columns={4} />
      )}
    </GameLayout>
  )
}
