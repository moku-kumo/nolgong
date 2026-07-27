import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

// 고품질 음성을 우선 선택
function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const langCode = lang.split('-')[0] // 'ko-KR' -> 'ko'

  // 해당 언어의 음성만 필터
  const matching = voices.filter(
    (v) => v.lang.startsWith(langCode) || v.lang.startsWith(lang),
  )
  if (matching.length === 0) return null

  // 우선순위: Google > Microsoft > 기타 (이름에서 판별)
  const preferOrder = ['google', 'microsoft', 'premium', 'enhanced', 'natural']
  for (const keyword of preferOrder) {
    const found = matching.find((v) => v.name.toLowerCase().includes(keyword))
    if (found) return found
  }

  // 네트워크(원격) 음성 우선 (보통 더 고품질)
  const remote = matching.find((v) => !v.localService)
  if (remote) return remote

  return matching[0]
}

export function useSpeech() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  const speak = useCallback(
    (text: string, lang: string, rate?: number) => {
      if (!soundEnabled) return
      if (!('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      const voice = getBestVoice(lang)
      if (voice) utter.voice = voice
      utter.rate = rate ?? 0.9
      utter.pitch = 1.0
      window.speechSynthesis.speak(utter)
    },
    [soundEnabled],
  )

  return { speak }
}
