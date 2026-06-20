import { create } from 'zustand'
import { load, save } from '@/lib/storage'

// 학습 최고 기록 (연속 맞춘 횟수)
// 게임 최고 기록 (점수 or 시간)
export interface PersonalRecords {
  // 학습: 최대 연속 정답 수
  streaks: Record<string, number>  // e.g. { 'math/addition': 12, 'math/subtraction': 8 }

  // 게임: 최고 점수 (높을수록 좋음)
  highScores: Record<string, number>  // e.g. { 'game/whack': 25, 'game/poop': 30 }

  // 게임: 최단 시간 (낮을수록 좋음, 초 단위)
  bestTimes: Record<string, number>  // e.g. { 'game/maze': 45, 'game/memory': 32 }
}

interface RecordsState extends PersonalRecords {
  updateStreak: (mode: string, streak: number) => boolean  // returns true if new record
  updateHighScore: (mode: string, score: number) => boolean
  updateBestTime: (mode: string, seconds: number) => boolean
  getStreak: (mode: string) => number
  getHighScore: (mode: string) => number
  getBestTime: (mode: string) => number | null
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  streaks: load<Record<string, number>>('records_streaks', {}),
  highScores: load<Record<string, number>>('records_highScores', {}),
  bestTimes: load<Record<string, number>>('records_bestTimes', {}),

  updateStreak: (mode, streak) => {
    const current = get().streaks[mode] ?? 0
    if (streak > current) {
      const streaks = { ...get().streaks, [mode]: streak }
      save('records_streaks', streaks)
      set({ streaks })
      return true
    }
    return false
  },

  updateHighScore: (mode, score) => {
    const current = get().highScores[mode] ?? 0
    if (score > current) {
      const highScores = { ...get().highScores, [mode]: score }
      save('records_highScores', highScores)
      set({ highScores })
      return true
    }
    return false
  },

  updateBestTime: (mode, seconds) => {
    const current = get().bestTimes[mode]
    if (current === undefined || seconds < current) {
      const bestTimes = { ...get().bestTimes, [mode]: seconds }
      save('records_bestTimes', bestTimes)
      set({ bestTimes })
      return true
    }
    return false
  },

  getStreak: (mode) => get().streaks[mode] ?? 0,
  getHighScore: (mode) => get().highScores[mode] ?? 0,
  getBestTime: (mode) => get().bestTimes[mode] ?? null,
}))
