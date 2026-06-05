import { useState, useCallback, useEffect, useRef } from 'react'
import GameLayout from '@/components/game/GameLayout'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AudioLines } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'
import { phonicsList, type PhonicsEntry } from '@/data/phonics'
import { shuffle, pickRandom } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

function generateProblem(lastLetter?: string) {
  let entries: PhonicsEntry[]
  let attempts = 0
  do {
    entries = pickRandom(phonicsList, 4) as PhonicsEntry[]
    attempts++
  } while (entries[0].letter === lastLetter && attempts < 10)

  const correct = entries[0]
  const options = shuffle(entries)
  return { correct, options }
}

export default function Phonics() {
  const { timerEnabled, timerSeconds, soundEnabled } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('english/phonics')
  const { speak } = useSpeech()
  const lastLetterRef = useRef<string | undefined>(undefined)
  const [problem, setProblem] = useState(() => generateProblem())
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  // 문제가 바뀔 때 파닉스 소리 재생
  useEffect(() => {
    speak(problem.correct.sound, 'en-US', 0.8)
  }, [problem.correct.sound, speak])

  const next = useCallback(() => {
    const p = generateProblem(lastLetterRef.current)
    lastLetterRef.current = p.correct.letter
    setProblem(p)
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [])

  const handleSelect = (letter: string) => {
    if (feedback) return
    if (letter === problem.correct.letter) {
      if (soundEnabled) playCorrect()
      addCorrect()
      setFeedback('correct')
    } else {
      if (soundEnabled) playWrong()
      addWrong()
      setFeedback('wrong')
    }
  }

  const replay = () => {
    speak(problem.correct.sound, 'en-US', 0.8)
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
      title="파닉스"
      icon={AudioLines}
      iconGradient="from-teal-500 to-cyan-600"
      backTo="/english"
      backLabel="영어"
      score={score}
      total={total}
      timerEnabled={timerEnabled}
      timerSeconds={timerSeconds}
      timerKey={timerKey}
      onTimeUp={handleTimeUp}
    >
      {/* 이모지 + 단어 표시 */}
      <div className="text-center">
        <span className="text-8xl block mb-4">{problem.correct.emoji}</span>
        <p className="text-3xl font-bold text-gray-700 mb-1">{problem.correct.word}</p>
        <button
          onClick={replay}
          className="text-sm text-blue-400 hover:text-blue-600 transition-colors"
        >
          🔊 다시 듣기
        </button>
      </div>

      {/* 4지선다 알파벳 버튼 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {problem.options.map((opt) => (
          <button
            key={opt.letter}
            onClick={() => handleSelect(opt.letter)}
            disabled={feedback !== null}
            className={`py-5 rounded-2xl font-bold text-2xl transition-all shadow-md ${
              feedback && opt.letter === problem.correct.letter
                ? 'bg-green-400 text-white scale-105'
                : feedback && opt.letter !== problem.correct.letter
                  ? 'bg-gray-200 text-gray-400 scale-95'
                  : 'bg-white hover:bg-blue-50 text-gray-700 hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-4xl">{opt.letter}</span>
            <span className="text-lg text-gray-400 block">{opt.lower}</span>
          </button>
        ))}
      </div>

      <Feedback type={feedback} onDone={next} />
    </GameLayout>
  )
}
