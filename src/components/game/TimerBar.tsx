import { motion } from 'framer-motion'
import { useTimer } from '@/hooks/useTimer'

interface TimerBarProps {
  seconds: number
  onTimeUp?: () => void
}

export default function TimerBar({ seconds, onTimeUp }: TimerBarProps) {
  const { fraction } = useTimer(seconds, onTimeUp)

  const color =
    fraction > 0.5
      ? 'bg-gradient-to-r from-emerald-400 to-green-400'
      : fraction > 0.2
        ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
        : 'bg-gradient-to-r from-rose-400 to-red-400'

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: '100%' }}
        animate={{ width: `${fraction * 100}%` }}
        transition={{ duration: 0.3, ease: 'linear' }}
      />
    </div>
  )
}
