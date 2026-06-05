import { useState, useCallback, useEffect } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { Volume2 } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSpeech } from '@/hooks/useSpeech'
import { englishDictionary, type DictEntry } from '@/data/dictionary'
import { shuffle, pickRandom } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

type EnglishEntry = DictEntry & { en: string }

function generateProblem(wordCount: number) {
  const [correct, ...distractors] = pickRandom(englishDictionary, wordCount) as [EnglishEntry, ...EnglishEntry[]]
  const options = shuffle([correct, ...distractors])
  return { correct, options }
}

export default function ListenWord() {
  const { timerEnabled, timerSeconds, soundEnabled, englishSettings } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('english/listen')
  const { speak } = useSpeech()
  const [problem, setProblem] = useState(() => generateProblem(englishSettings.wordCount))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const speakWord = useCallback(() => {
    speak(problem.correct.en, 'en-US', englishSettings.ttsSpeed)
  }, [problem.correct.en, speak, englishSettings.ttsSpeed])

  useEffect(() => {
    speakWord()
  }, [speakWord])

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
      title="듣기"
      icon={Volume2}
      iconGradient="from-cyan-500 to-teal-600"
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
          onClick={speakWord}
          className="w-24 h-24 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center mx-auto transition-colors shadow-md"
          aria-label="다시 듣기"
        >
          <Volume2 size={48} className="text-blue-500" />
        </button>
        <p className="text-gray-400 text-sm mt-2">눌러서 다시 들어요!</p>
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid
          options={problem.options.map((o) => o.en)}
          onSelect={handleSelect}
          columns={2}
          renderOption={(opt) => {
            const word = problem.options.find((o) => o.en === opt)
            return (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">{word?.emoji}</span>
                <span className="text-lg">{opt}</span>
              </div>
            )
          }}
        />
      )}
    </GameLayout>
  )
}
