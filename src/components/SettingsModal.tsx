import { useSettingsStore, type AdditionDifficulty, type SubtractionDifficulty, type MultiplicationDifficulty, type ClockDifficulty, type AlphabetMode, type JamoFilter } from '@/stores/settingsStore'
import { useLocation } from 'react-router-dom'
import { X, Volume2, Timer, Gauge, Pen, Shapes, Type, BookOpen, Headphones } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-all ${on ? 'bg-indigo-500' : 'bg-gray-200'} relative flex-shrink-0`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-[20px]' : 'translate-x-0'}`}
      />
    </button>
  )
}

function SegmentButton<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 min-w-[60px] py-2 rounded-xl font-semibold text-sm transition-all ${
            value === o.value
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: typeof Volume2; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} className="text-indigo-400" />
      <span className="text-[15px] font-semibold text-gray-700">{label}</span>
    </div>
  )
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const store = useSettingsStore()
  const location = useLocation()
  const path = location.pathname

  if (!open) return null

  const isMath = path.includes('/math')
  const isAddition = path.includes('/addition')
  const isSubtraction = path.includes('/subtraction')
  const isMultiplication = path.includes('/multiplication')
  const isBlank = path.includes('/blank')
  const isPattern = path.includes('/pattern')
  const isClock = path.includes('/clock')
  const isEnglish = path.includes('/english')
  const isAlphabet = path.includes('/alphabet')
  const isPicture = path.includes('/picture')
  const isListen = path.includes('/listen')
  const isKorean = path.includes('/korean')
  const isJamo = path.includes('/jamo')
  const isWord = path.includes('/word')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[360px] max-w-[92vw] max-h-[85vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">설정</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 공통 설정 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Volume2 size={18} className="text-green-500" />
              </div>
              <span className="text-[15px] font-medium text-gray-700">소리</span>
            </div>
            <Toggle on={store.soundEnabled} onToggle={() => store.setSoundEnabled(!store.soundEnabled)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <Timer size={18} className="text-orange-500" />
              </div>
              <span className="text-[15px] font-medium text-gray-700">타이머</span>
            </div>
            <Toggle on={store.timerEnabled} onToggle={() => store.setTimerEnabled(!store.timerEnabled)} />
          </div>

          {store.timerEnabled && (
            <div className="pl-12">
              <span className="text-sm text-gray-400">제한시간: {store.timerSeconds}초</span>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={store.timerSeconds}
                onChange={(e) => store.setTimerSeconds(Number(e.target.value))}
                className="w-full mt-1 accent-indigo-500"
              />
            </div>
          )}

          {/* 수학: 더하기 */}
          {(isAddition || (isMath && !isSubtraction && !isMultiplication && !isBlank && !isPattern && !isClock)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Gauge} label="더하기 난이도" />
              <SegmentButton<AdditionDifficulty>
                options={[
                  { value: 'easy', label: '쉬움 (1~5)' },
                  { value: 'normal', label: '보통 (0~10)' },
                  { value: 'hard', label: '어려움 (0~20)' },
                ]}
                value={store.additionDifficulty}
                onChange={store.setAdditionDifficulty}
              />
            </div>
          )}

          {/* 수학: 빼기 */}
          {(isSubtraction || (isMath && !isAddition && !isMultiplication && !isBlank && !isPattern && !isClock)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Gauge} label="빼기 난이도" />
              <SegmentButton<SubtractionDifficulty>
                options={[
                  { value: 'easy', label: '쉬움 (1~5)' },
                  { value: 'normal', label: '보통 (0~10)' },
                  { value: 'hard', label: '어려움 (0~20)' },
                ]}
                value={store.subtractionDifficulty}
                onChange={store.setSubtractionDifficulty}
              />
            </div>
          )}

          {/* 수학: 곱하기 */}
          {(isMultiplication || (isMath && !isAddition && !isSubtraction && !isBlank && !isPattern && !isClock)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Gauge} label="곱하기 난이도" />
              <SegmentButton<MultiplicationDifficulty>
                options={[
                  { value: 'easy', label: '쉬움 (2~5단)' },
                  { value: 'normal', label: '보통 (2~9단)' },
                  { value: 'hard', label: '어려움 (×12까지)' },
                ]}
                value={store.multiplicationDifficulty}
                onChange={store.setMultiplicationDifficulty}
              />
            </div>
          )}

          {/* 수학: 빈칸채우기 */}
          {(isBlank || (isMath && !isAddition && !isSubtraction && !isMultiplication && !isPattern && !isClock)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Pen} label="빈칸채우기" />
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">숫자범위: {store.patternSettings.minNum}~{store.patternSettings.maxNum}</span>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="number" min={1} max={store.patternSettings.maxNum - 5} value={store.patternSettings.minNum} onChange={(e) => store.setPatternSettings({ minNum: Math.max(1, Number(e.target.value)) })} className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:border-indigo-400 focus:outline-none" />
                    <span className="text-gray-300">~</span>
                    <input type="number" min={store.patternSettings.minNum + 5} max={100} value={store.patternSettings.maxNum} onChange={(e) => store.setPatternSettings({ maxNum: Math.min(100, Number(e.target.value)) })} className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:border-indigo-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-400">빈칸 수</span>
                  <SegmentButton<string>
                    options={[{ value: '1', label: '1개' }, { value: '2', label: '2개' }, { value: '3', label: '3개' }]}
                    value={String(store.patternSettings.blankCount)}
                    onChange={(v) => store.setPatternSettings({ blankCount: Number(v) })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 수학: 패턴채우기 */}
          {(isPattern || (isMath && !isAddition && !isSubtraction && !isMultiplication && !isBlank && !isClock)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Shapes} label="패턴채우기" />
              <SegmentButton<'easy' | 'hard'>
                options={[{ value: 'easy', label: '쉬움 (5단위)' }, { value: 'hard', label: '어려움 (랜덤)' }]}
                value={store.stepPatternSettings.difficulty}
                onChange={(v) => store.setStepPatternSettings({ difficulty: v })}
              />
              <div className="mt-3">
                <span className="text-sm text-gray-400">빈칸 수</span>
                <SegmentButton<string>
                  options={[{ value: '1', label: '1개' }, { value: '2', label: '2개' }, { value: '3', label: '3개' }]}
                  value={String(store.stepPatternSettings.blankCount)}
                  onChange={(v) => store.setStepPatternSettings({ blankCount: Number(v) })}
                />
              </div>
              <div className="mt-3">
                <span className="text-sm text-gray-400">최대 숫자: {store.stepPatternSettings.maxNum}</span>
                <input type="range" min={20} max={100} step={10} value={store.stepPatternSettings.maxNum} onChange={(e) => store.setStepPatternSettings({ maxNum: Number(e.target.value) })} className="w-full mt-1 accent-indigo-500" />
              </div>
            </div>
          )}

          {/* 수학: 시계 읽기 */}
          {(isClock || (isMath && !isAddition && !isSubtraction && !isMultiplication && !isBlank && !isPattern)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Gauge} label="시계 난이도" />
              <SegmentButton<ClockDifficulty>
                options={[
                  { value: 'easy', label: '쉬움 (정각)' },
                  { value: 'normal', label: '보통 (30분)' },
                  { value: 'hard', label: '어려움 (5분)' },
                ]}
                value={store.clockDifficulty}
                onChange={store.setClockDifficulty}
              />
            </div>
          )}

          {/* 영어: 알파벳 */}
          {(isAlphabet || (isEnglish && !isPicture && !isListen)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Type} label="알파벳 모드" />
              <SegmentButton<AlphabetMode>
                options={[{ value: 'upperToLower', label: '대→소' }, { value: 'lowerToUpper', label: '소→대' }, { value: 'mixed', label: '섞기' }]}
                value={store.englishSettings.alphabetMode}
                onChange={(v) => store.setEnglishSettings({ alphabetMode: v })}
              />
            </div>
          )}

          {/* 영어: 보기 수 & TTS */}
          {(isPicture || isListen || (isEnglish && !isAlphabet)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Headphones} label="영어 단어" />
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">보기 수</span>
                  <SegmentButton<string>
                    options={[{ value: '2', label: '2개' }, { value: '4', label: '4개' }, { value: '6', label: '6개' }]}
                    value={String(store.englishSettings.wordCount)}
                    onChange={(v) => store.setEnglishSettings({ wordCount: Number(v) })}
                  />
                </div>
                {(isListen || isEnglish) && (
                  <div>
                    <span className="text-sm text-gray-400">듣기 속도: {store.englishSettings.ttsSpeed.toFixed(2)}</span>
                    <input type="range" min={0.5} max={1.2} step={0.05} value={store.englishSettings.ttsSpeed} onChange={(e) => store.setEnglishSettings({ ttsSpeed: Number(e.target.value) })} className="w-full mt-1 accent-indigo-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 국어: 자음모음 */}
          {(isJamo || (isKorean && !isWord)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={Type} label="자음/모음 필터" />
              <SegmentButton<JamoFilter>
                options={[{ value: 'all', label: '전체' }, { value: 'consonant', label: '자음만' }, { value: 'vowel', label: '모음만' }]}
                value={store.koreanSettings.jamoFilter}
                onChange={(v) => store.setKoreanSettings({ jamoFilter: v })}
              />
            </div>
          )}

          {/* 국어: 단어 길이 */}
          {(isWord || (isKorean && !isJamo)) && (
            <div className="border-t border-gray-100 pt-4">
              <SectionLabel icon={BookOpen} label="단어 길이" />
              <SegmentButton<string>
                options={[{ value: 'all', label: '전체' }, { value: 'short', label: '짧은 (2자)' }, { value: 'long', label: '긴 (3자+)' }]}
                value={store.koreanSettings.wordLength}
                onChange={(v) => store.setKoreanSettings({ wordLength: v as 'all' | 'short' | 'long' })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
