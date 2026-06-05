import { useState, useCallback, useEffect } from 'react'
import GameLayout from '@/components/game/GameLayout'
import OptionGrid from '@/components/game/OptionGrid'
import Feedback from '@/components/game/Feedback'
import { useScore } from '@/hooks/useScore'
function GieukIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="700" fontFamily="sans-serif">ㄱ</text>
    </svg>
  )
}
import { useSettingsStore, type JamoFilter } from '@/stores/settingsStore'
import { useSpeech } from '@/hooks/useSpeech'
import { jamoList, type JamoEntry } from '@/data/koreanJamo'
import { shuffle, pickRandom } from '@/lib/random'
import { playCorrect, playWrong } from '@/lib/audio'

function getFilteredJamo(filter: JamoFilter): JamoEntry[] {
  if (filter === 'consonant') return jamoList.filter((j) => j.type === 'consonant')
  if (filter === 'vowel') return jamoList.filter((j) => j.type === 'vowel')
  return jamoList
}

function generateProblem(filter: JamoFilter) {
  const pool = getFilteredJamo(filter)
  const [correct, ...distractors] = pickRandom(pool, Math.min(4, pool.length)) as [JamoEntry, ...JamoEntry[]]
  const options = shuffle([correct, ...distractors])
  return { correct, options }
}

export default function Jamo() {
  const { timerEnabled, timerSeconds, soundEnabled, koreanSettings } = useSettingsStore()
  const { score, total, addCorrect, addWrong } = useScore('korean/jamo')
  const { speak } = useSpeech()
  const [problem, setProblem] = useState(() => generateProblem(koreanSettings.jamoFilter))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  useEffect(() => {
    // 자음은 이름(기역,니은...)으로, 모음은 소리(아,야...)로 읽어줌
    const text = problem.correct.type === 'consonant' ? problem.correct.name : problem.correct.sound
    speak(text, 'ko-KR')
  }, [problem.correct, speak])

  const next = useCallback(() => {
    setProblem(generateProblem(koreanSettings.jamoFilter))
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [koreanSettings.jamoFilter])

  const handleSelect = (opt: string) => {
    if (feedback) return
    if (opt === problem.correct.char) {
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
      title="자음/모음"
      icon={GieukIcon}
      iconGradient="from-violet-500 to-purple-600"
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
        <p className="text-sm text-gray-400 mb-1">
          이 소리의 글자를 찾아요! ({problem.correct.type === 'consonant' ? '자음' : '모음'})
        </p>
        <div className="text-6xl font-bold text-purple-500 mb-2">
          "{problem.correct.name}"
        </div>
      </div>

      {feedback ? (
        <Feedback type={feedback} onDone={next} />
      ) : (
        <OptionGrid
          options={problem.options.map((o) => o.char)}
          onSelect={handleSelect}
          columns={4}
        />
      )}
    </GameLayout>
  )
}
