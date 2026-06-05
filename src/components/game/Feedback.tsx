import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'

interface FeedbackProps {
  type: 'correct' | 'wrong' | null
  onDone?: () => void
}

export default function Feedback({ type, onDone }: FeedbackProps) {
  useEffect(() => {
    if (type && onDone) {
      const t = setTimeout(onDone, type === 'correct' ? 1000 : 1500)
      return () => clearTimeout(t)
    }
  }, [type, onDone])

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          className={`flex items-center gap-2 text-2xl font-bold ${type === 'correct' ? 'text-emerald-500' : 'text-rose-400'}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {type === 'correct' ? (
            <>
              <CheckCircle2 size={28} />
              <span>정답!</span>
            </>
          ) : (
            <>
              <RefreshCw size={28} />
              <span>다시 해봐요!</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
