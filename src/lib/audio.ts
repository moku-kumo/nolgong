let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

// iPad/iOS에서 AudioContext를 유저 제스처로 unlock
let unlocked = false
export function unlockAudio() {
  if (unlocked) return
  const ctx = getCtx()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  // 무음 버퍼를 재생해서 완전히 unlock
  const buffer = ctx.createBuffer(1, 1, 22050)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
  unlocked = true
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export function playCorrect() {
  playTone(523.25, 0.12, 'sine') // C5
  setTimeout(() => playTone(659.25, 0.12, 'sine'), 100) // E5
  setTimeout(() => playTone(783.99, 0.2, 'sine'), 200)  // G5
}

export function playWrong() {
  playTone(200, 0.3, 'sawtooth')
}

export function playClick() {
  playTone(440, 0.05, 'sine')
}
