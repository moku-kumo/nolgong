import { motion } from 'framer-motion'

interface OptionGridProps<T extends string | number> {
  options: T[]
  onSelect: (option: T) => void
  disabled?: boolean
  columns?: number
  renderOption?: (option: T) => React.ReactNode
}

export default function OptionGrid<T extends string | number>({
  options,
  onSelect,
  disabled = false,
  columns = 3,
  renderOption,
}: OptionGridProps<T>) {
  const colWidth = columns === 2 ? 'w-[calc(50%-6px)]' : columns === 4 ? 'w-[calc(25%-9px)]' : 'w-[calc(33.333%-8px)]'

  return (
    <div className="flex flex-wrap gap-3 w-full max-w-md mx-auto justify-center">
      {options.map((opt, i) => (
        <motion.button
          key={String(opt)}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className={`${colWidth} group relative flex items-center justify-center rounded-2xl bg-white border border-gray-200/80 p-4 text-2xl font-bold text-gray-700 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] transition-all disabled:opacity-50 min-h-[64px] overflow-hidden`}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.04, type: 'spring' as const, stiffness: 300, damping: 20 }}
          whileTap={{ scale: 0.93 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all" />
          <span className="relative z-10">{renderOption ? renderOption(opt) : String(opt)}</span>
        </motion.button>
      ))}
    </div>
  )
}
