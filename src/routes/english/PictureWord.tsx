import { useState, useCallback } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSpeech } from '@/hooks/useSpeech'
import { Image } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { englishDictionary, type DictEntry } from '@/data/dictionary'
import { shuffle, pickRandom } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

type EnglishEntry = DictEntry & { en: string }

function generateProblem(wordCount: number) {
  const [correct, ...distractors] = pickRandom(englishDictionary, wordCount) as [EnglishEntry, ...EnglishEntry[]]
  const options = shuffle([correct, ...distractors])
  return { correct, options }
}

export default function PictureWord() {
  const { timerEnabled, timerSeconds, soundEnabled, englishSettings } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('english/picture')
  const { speak } = useSpeech()
  const [problem, setProblem] = useState(() => generateProblem(englishSettings.wordCount))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    setProblem(generateProblem(englishSettings.wordCount))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [englishSettings.wordCount])

  const handleSelect = (opt: string) => {
    if (feedback) return
    if (opt === problem.correct.en) {
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
      title="그림단어"
      icon={Image}
      iconGradient="from-green-500 to-emerald-600"
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
        <button
          onClick={() => speak(problem.correct.en, 'en-US', englishSettings.ttsSpeed)}
          className="text-8xl mb-2 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          aria-label="발음 듣기"
        >
          {problem.correct.emoji}
        </button>
        <p className="text-gray-400 text-sm">그림을 누르면 발음을 들을 수 있어요!</p>
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid
          options={problem.options.map((o) => o.en)}
          onSelect={handleSelect}
          columns={2}
        />
      )}
    </GameLayout>
  )
}
