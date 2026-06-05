import { CheckCircle2 } from 'lucide-react'

interface ScoreBoardProps {
  score: number
  total: number
}

export default function ScoreBoard({ score, total }: ScoreBoardProps) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5">
      <CheckCircle2 size={14} className="text-emerald-500" />
      <span className="text-sm font-bold text-gray-700">{score}</span>
      <span className="text-gray-300">/</span>
      <span className="text-sm font-medium text-gray-400">{total}</span>
    </div>
  )
}
