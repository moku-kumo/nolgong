import { create } from 'zustand'
import { load, save } from '@/lib/storage'

// --- 수학 난이도 (SmartGame 이식) ---
export type AdditionDifficulty = 'easy' | 'normal' | 'hard'
export const additionRanges = {
  easy: { min: 1, max: 5 },
  normal: { min: 0, max: 10 },
  hard: { min: 0, max: 20 },
} as const

export type MultiplicationDifficulty = 'easy' | 'normal' | 'hard'
export type ClockDifficulty = 'easy' | 'normal' | 'hard'

export interface PatternSettings {
  minNum: number
  maxNum: number
  blankCount: number // 1~3
}

export interface StepPatternSettings {
  difficulty: 'easy' | 'hard' // easy=5단위, hard=랜덤 간격
  maxNum: number
  blankCount: number // 1~3
}

// --- 영어 난이도 ---
export type AlphabetMode = 'upperToLower' | 'lowerToUpper' | 'mixed'
export interface EnglishSettings {
  alphabetMode: AlphabetMode
  wordCount: number    // 보기 수 (2 | 4 | 6)
  ttsSpeed: number     // 0.7 ~ 1.2
}

// --- 국어 난이도 ---
export type JamoFilter = 'all' | 'consonant' | 'vowel'
export interface KoreanSettings {
  jamoFilter: JamoFilter
  wordLength: 'short' | 'long' | 'all' // short=2자, long=3자+, all
}

// --- 전체 설정 ---
interface SettingsState {
  soundEnabled: boolean
  timerEnabled: boolean
  timerSeconds: number // 글로벌 타이머 초
  requiredStudyMinutes: number // 게임 잠금 해제 기준 (분)
  parentPin: string // 부모 인증 PIN (4자리)

  // 수학
  additionDifficulty: AdditionDifficulty
  multiplicationDifficulty: MultiplicationDifficulty
  clockDifficulty: ClockDifficulty
  patternSettings: PatternSettings
  stepPatternSettings: StepPatternSettings

  // 영어
  englishSettings: EnglishSettings

  // 국어
  koreanSettings: KoreanSettings

  // setters
  setSoundEnabled: (v: boolean) => void
  setTimerEnabled: (v: boolean) => void
  setTimerSeconds: (v: number) => void
  setRequiredStudyMinutes: (v: number) => void
  setParentPin: (v: string) => void
  setAdditionDifficulty: (v: AdditionDifficulty) => void
  setMultiplicationDifficulty: (v: MultiplicationDifficulty) => void
  setClockDifficulty: (v: ClockDifficulty) => void
  setPatternSettings: (v: Partial<PatternSettings>) => void
  setStepPatternSettings: (v: Partial<StepPatternSettings>) => void
  setEnglishSettings: (v: Partial<EnglishSettings>) => void
  setKoreanSettings: (v: Partial<KoreanSettings>) => void
}

const defaultPatternSettings: PatternSettings = { minNum: 1, maxNum: 50, blankCount: 1 }
const defaultStepPatternSettings: StepPatternSettings = { difficulty: 'easy', maxNum: 50, blankCount: 1 }
const defaultEnglishSettings: EnglishSettings = { alphabetMode: 'mixed', wordCount: 4, ttsSpeed: 0.85 }
const defaultKoreanSettings: KoreanSettings = { jamoFilter: 'all', wordLength: 'all' }

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: load('soundEnabled', true),
  timerEnabled: load('timerEnabled', true),
  timerSeconds: load('timerSeconds', 25),
  requiredStudyMinutes: load('requiredStudyMinutes', 5),
  parentPin: load('parentPin', '0000'),

  additionDifficulty: load<AdditionDifficulty>('additionDifficulty', 'easy'),
  multiplicationDifficulty: load<MultiplicationDifficulty>('multiplicationDifficulty', 'easy'),
  clockDifficulty: load<ClockDifficulty>('clockDifficulty', 'normal'),
  patternSettings: load<PatternSettings>('patternSettings', defaultPatternSettings),
  stepPatternSettings: load<StepPatternSettings>('stepPatternSettings', defaultStepPatternSettings),
  englishSettings: load<EnglishSettings>('englishSettings', defaultEnglishSettings),
  koreanSettings: load<KoreanSettings>('koreanSettings', defaultKoreanSettings),

  setSoundEnabled: (v) => { save('soundEnabled', v); set({ soundEnabled: v }) },
  setTimerEnabled: (v) => { save('timerEnabled', v); set({ timerEnabled: v }) },
  setTimerSeconds: (v) => { save('timerSeconds', v); set({ timerSeconds: v }) },
  setRequiredStudyMinutes: (v) => { save('requiredStudyMinutes', v); set({ requiredStudyMinutes: v }) },
  setParentPin: (v) => { save('parentPin', v); set({ parentPin: v }) },

  setAdditionDifficulty: (v) => { save('additionDifficulty', v); set({ additionDifficulty: v }) },
  setMultiplicationDifficulty: (v) => { save('multiplicationDifficulty', v); set({ multiplicationDifficulty: v }) },
  setClockDifficulty: (v) => { save('clockDifficulty', v); set({ clockDifficulty: v }) },
  setPatternSettings: (v) => {
    const merged = { ...get().patternSettings, ...v }
    save('patternSettings', merged); set({ patternSettings: merged })
  },
  setStepPatternSettings: (v) => {
    const merged = { ...get().stepPatternSettings, ...v }
    save('stepPatternSettings', merged); set({ stepPatternSettings: merged })
  },
  setEnglishSettings: (v) => {
    const merged = { ...get().englishSettings, ...v }
    save('englishSettings', merged); set({ englishSettings: merged })
  },
  setKoreanSettings: (v) => {
    const merged = { ...get().koreanSettings, ...v }
    save('koreanSettings', merged); set({ koreanSettings: merged })
  },
}))
