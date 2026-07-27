import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { stories } from '@/data/stories'

export default function StoryHome() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/korean" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">동화 읽기</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 pb-8">
        <p className="text-center text-gray-500 text-sm mb-6">
          재미있는 동화를 읽어봐요! 📖
        </p>

        <div className="space-y-3">
          {stories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={`/korean/story/${story.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-amber-100 hover:shadow-md hover:border-amber-200 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl shrink-0">
                  {story.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-[15px]">{story.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{story.pages.length}페이지</p>
                </div>
                <BookOpen size={18} className="text-amber-400 shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
