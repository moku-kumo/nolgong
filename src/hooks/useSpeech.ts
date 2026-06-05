import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function useSpeech() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  const speak = useCallback(
    (text: string, lang: string, rate?: number) => {
      if (!soundEnabled) return
      if (!('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = rate ?? 0.85
      utter.pitch = 1.1
      window.speechSynthesis.speak(utter)
    },
    [soundEnabled],
  )

  return { speak }
}
