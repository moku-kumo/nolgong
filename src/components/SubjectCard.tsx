import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

interface SubjectCardProps {
  to: string
  icon: LucideIcon | React.ComponentType<any>
  label: string
  desc?: string
  index: number
  gradient: string
  iconColor: string
  disabled?: boolean
}

export default function SubjectCard({ to, icon: Icon, label, desc, index, gradient, iconColor, disabled }: SubjectCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {disabled ? (
        <div className="flex items-center gap-4 p-4 bg-gray-100/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm opacity-60 cursor-not-allowed">
          <div className={`w-12 h-12 rounded-xl bg-gray-300 flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon size={22} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[16px] font-semibold text-gray-500 block">{label}</span>
            {desc && <span className="text-[13px] text-gray-400">{desc}</span>}
          </div>
        </div>
      ) : (
        <Link
          to={to}
          className="group flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:bg-white active:scale-[0.97] transition-all"
        >
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon size={22} className={iconColor} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[16px] font-semibold text-gray-800 block">{label}</span>
            {desc && <span className="text-[13px] text-gray-400">{desc}</span>}
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      )}
    </motion.div>
  )
}
