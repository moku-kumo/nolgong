import { useState, useCallback, useRef } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
import { BookOpen } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { dictionary, type DictEntry } from '@/data/dictionary'
import { shuffle, pickRandom } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

function filterByLength(words: DictEntry[], wordLength: string): DictEntry[] {
  if (wordLength === 'short') return words.filter((w) => w.ko.length <= 2)
  if (wordLength === 'long') return words.filter((w) => w.ko.length >= 3)
  return words
}

function generateProblem(wordLength: string, lastWord?: string) {
  const pool = filterByLength(dictionary, wordLength)
  const src = pool.length >= 4 ? pool : dictionary
  let correct: DictEntry
  let distractors: DictEntry[]
  // 연속 같은 단어 방지
  let attempts = 0
  do {
    ;[correct, ...distractors] = pickRandom(src, 4) as [DictEntry, ...DictEntry[]]
    attempts++
  } while (correct.ko === lastWord && src.length > 1 && attempts < 10)
  const options = shuffle([correct, ...distractors])
  return { correct, options }
}

export default function ReadWord() {
  const { timerEnabled, timerSeconds, soundEnabled, koreanSettings } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('korean/word')
  const lastWordRef = useRef<string | undefined>(undefined)
  const [problem, setProblem] = useState(() => generateProblem(koreanSettings.wordLength))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const next = useCallback(() => {
    const p = generateProblem(koreanSettings.wordLength, lastWordRef.current)
    lastWordRef.current = p.correct.ko
    setProblem(p)
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [koreanSettings.wordLength])

  const handleSelect = (opt: string) => {
    if (feedback) return
    if (opt === problem.correct.ko) {
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
      title="단어읽기"
      icon={BookOpen}
      iconGradient="from-purple-500 to-fuchsia-600"
      backTo="/korean"
      backLabel="한글"
      score={score}
      total={total}
      timerEnabled={timerEnabled}
      timerSeconds={timerSeconds}
      timerKey={timerKey}
      onTimeUp={handleTimeUp}
    >
      <div className="text-center mb-4">
        <div className="text-8xl mb-2">{problem.correct.emoji}</div>
        <p className="text-gray-400 text-sm">이 그림의 이름을 찾아요!</p>
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid
          options={problem.options.map((o) => o.ko)}
          onSelect={handleSelect}
          columns={2}
        />
      )}
    </GameLayout>
  )
}
