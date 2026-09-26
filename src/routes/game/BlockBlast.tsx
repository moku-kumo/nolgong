import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, RotateCcw, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useRecordsStore } from '@/stores/recordsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { playCorrect } from '@/lib/audio'

const BOARD_SIZE = 8
const COLORS = ['#24b7d3', '#f5a524', '#ef5b6c', '#4cc38a', '#8b6de9']

const SHAPES = [
  [[0, 0]],
  [[0, 0], [1, 0]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [[1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
] as const

type Board = (string | null)[][]
type ShapeCells = readonly (readonly [number, number])[]
type Piece = { id: number; cells: ShapeCells; color: string }
type Position = { row: number; col: number }
type ScoreBurst = { id: number; label: string; points: number }

const emptyBoard = (): Board => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null))

function makePieces(): Piece[] {
  return Array.from({ length: 3 }, (_, index) => ({
    id: Date.now() + index,
    cells: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))
}

function canPlace(board: Board, cells: ShapeCells, row: number, col: number) {
  return cells.every(([x, y]) => {
    const targetRow = row + y
    const targetCol = col + x
    return targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE && !board[targetRow][targetCol]
  })
}

function hasMove(board: Board, pieces: Piece[]) {
  return pieces.some(piece =>
    Array.from({ length: BOARD_SIZE }, (_, row) =>
      Array.from({ length: BOARD_SIZE }, (_, col) => canPlace(board, piece.cells, row, col)).some(Boolean),
    ).some(Boolean),
  )
}

function PiecePreview({ piece, selected }: { piece: Piece; selected: boolean }) {
  const width = Math.max(...piece.cells.map(([x]) => x)) + 1
  const height = Math.max(...piece.cells.map(([, y]) => y)) + 1

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${width}, 1fr)`, width: width * 25, height: height * 25 }}
    >
      {Array.from({ length: width * height }, (_, index) => {
        const x = index % width
        const y = Math.floor(index / width)
        const filled = piece.cells.some(([cellX, cellY]) => cellX === x && cellY === y)
        return (
          <span
            key={index}
            className="rounded-[5px]"
            style={{
              background: filled ? `linear-gradient(145deg, rgba(255,255,255,.5), transparent 48%), ${piece.color}` : 'transparent',
              boxShadow: filled
                ? selected
                  ? `0 5px 0 color-mix(in srgb, ${piece.color} 72%, black), 0 0 0 2px white, 0 0 0 4px ${piece.color}`
                  : `0 4px 0 color-mix(in srgb, ${piece.color} 72%, black)`
                : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

export default function BlockBlast() {
  useGameTimer()
  const soundEnabled = useSettingsStore(state => state.soundEnabled)
  const { getHighScore, updateHighScore } = useRecordsStore()
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [pieces, setPieces] = useState<Piece[]>(makePieces)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [hovered, setHovered] = useState<Position | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => getHighScore('game/block-blast'))
  const [combo, setCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set())
  const [scoreBurst, setScoreBurst] = useState<ScoreBurst | null>(null)
  const [impact, setImpact] = useState(0)
  const [isResolving, setIsResolving] = useState(false)
  const draggingRef = useRef(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const burstIdRef = useRef(0)

  const selectedPiece = pieces.find(piece => piece.id === selectedId) ?? null

  useEffect(() => () => clearTimeout(clearTimerRef.current), [])

  const placePiece = useCallback((piece: Piece, row: number, col: number) => {
    if (gameOver || isResolving || !canPlace(board, piece.cells, row, col)) return

    const placedBoard = board.map(line => [...line])
    piece.cells.forEach(([x, y]) => { placedBoard[row + y][col + x] = piece.color })

    const fullRows = placedBoard.flatMap((line, index) => line.every(Boolean) ? [index] : [])
    const fullCols = Array.from({ length: BOARD_SIZE }, (_, column) => column)
      .filter(column => placedBoard.every(line => Boolean(line[column])))
    const clearedLines = fullRows.length + fullCols.length
    const nextCombo = clearedLines > 0 ? combo + 1 : 0
    const earnedPoints = piece.cells.length * 10 + clearedLines * 100 * Math.max(1, nextCombo)
    const nextScore = score + earnedPoints

    setScore(nextScore)
    setCombo(nextCombo)
    setScoreBurst({
      id: burstIdRef.current++,
      label: clearedLines > 1 ? `${clearedLines}줄 폭발!` : clearedLines === 1 ? '라인 클리어!' : '좋아요!',
      points: earnedPoints,
    })

    const remaining = pieces.filter(item => item.id !== piece.id)
    const nextPieces = remaining.length === 0 ? makePieces() : remaining
    setPieces(nextPieces)
    setSelectedId(null)
    setHovered(null)

    if (clearedLines === 0) {
      setBoard(placedBoard)
      if (!hasMove(placedBoard, nextPieces)) {
        setGameOver(true)
        if (updateHighScore('game/block-blast', nextScore)) setBestScore(nextScore)
      }
      return
    }

    const targets = new Set<string>()
    fullRows.forEach(targetRow => {
      for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex++) targets.add(`${targetRow}-${colIndex}`)
    })
    fullCols.forEach(targetCol => {
      for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex++) targets.add(`${rowIndex}-${targetCol}`)
    })

    setBoard(placedBoard)
    setClearingCells(targets)
    setIsResolving(true)
    setImpact(current => current + 1)
    if (soundEnabled) playCorrect()
    navigator.vibrate?.(clearedLines > 1 ? [35, 30, 55] : 35)

    clearTimerRef.current = setTimeout(() => {
      const clearedBoard = placedBoard.map(line => [...line])
      fullRows.forEach(targetRow => { clearedBoard[targetRow] = Array(BOARD_SIZE).fill(null) })
      fullCols.forEach(targetCol => { clearedBoard.forEach(line => { line[targetCol] = null }) })
      setBoard(clearedBoard)
      setClearingCells(new Set())
      setIsResolving(false)
      if (!hasMove(clearedBoard, nextPieces)) {
        setGameOver(true)
        if (updateHighScore('game/block-blast', nextScore)) setBestScore(nextScore)
      }
    }, 430)
  }, [board, combo, gameOver, isResolving, pieces, score, soundEnabled, updateHighScore])

  const restart = () => {
    clearTimeout(clearTimerRef.current)
    setBoard(emptyBoard())
    setPieces(makePieces())
    setSelectedId(null)
    setHovered(null)
    setScore(0)
    setCombo(0)
    setGameOver(false)
    setClearingCells(new Set())
    setScoreBurst(null)
    setIsResolving(false)
  }

  const locateCell = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-board-cell]')
    if (!element) return null
    return { row: Number(element.dataset.row), col: Number(element.dataset.col) }
  }

  const hoveredCells = selectedPiece && hovered
    ? new Set(selectedPiece.cells
      .map(([x, y]) => `${hovered.row + y}-${hovered.col + x}`)
      .filter(key => {
        const [row, col] = key.split('-').map(Number)
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
      }))
    : new Set<string>()
  const validPreview = Boolean(selectedPiece && hovered && canPlace(board, selectedPiece.cells, hovered.row, hovered.col))

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_50%_28%,#ffffff_0%,#eef8f3_45%,#dceee7_100%)] flex flex-col overflow-hidden select-none">
      <header className="h-[60px] shrink-0 bg-white/85 backdrop-blur-xl border-b border-emerald-900/10">
        <div className="max-w-lg h-full mx-auto px-4 flex items-center justify-between">
          <Link to="/game" aria-label="게임 목록" className="p-2.5 rounded-xl hover:bg-emerald-50"><ChevronLeft size={21} className="text-slate-600" /></Link>
          <div className="text-center leading-tight">
            <h1 className="font-black text-slate-800">블록 블라스트</h1>
            <p className="text-[11px] font-bold text-emerald-600">BEST {bestScore.toLocaleString()}</p>
          </div>
          <button onClick={restart} aria-label="다시 시작" className="p-2.5 rounded-xl hover:bg-emerald-50"><RotateCcw size={19} className="text-slate-600" /></button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-3 sm:py-4 flex flex-col items-center justify-center gap-3 sm:gap-4">
        <section className="w-full flex items-end justify-between px-2">
          <div>
            <p className="text-[11px] font-black tracking-[.14em] text-slate-400">SCORE</p>
            <motion.p key={score} initial={{ scale: 1.28, color: '#10b981' }} animate={{ scale: 1, color: '#1e293b' }} className="text-3xl font-black text-slate-800 tabular-nums origin-left">{score.toLocaleString()}</motion.p>
          </div>
          <AnimatePresence>
            {combo > 1 && (
              <motion.div initial={{ scale: .5, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} exit={{ opacity: 0 }} className="px-3 py-1.5 rounded-full bg-amber-400 text-amber-950 shadow-[0_4px_0_#d97706] font-black text-sm">
                {combo} COMBO!
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <motion.div
          key={impact}
          animate={impact > 0 ? { x: [0, -5, 5, -3, 3, 0], scale: [1, 1.012, 1] } : undefined}
          transition={{ duration: .32 }}
          className="relative w-full max-w-[420px] aspect-square p-2.5 bg-[linear-gradient(145deg,#17645d,#103f3d)] rounded-[8px] border-[3px] border-white shadow-[0_14px_0_#0d3734,0_24px_45px_rgba(22,78,74,.25)]"
        >
          <div className="grid grid-cols-8 gap-1 h-full">
            {board.map((line, row) => line.map((color, col) => {
              const cellKey = `${row}-${col}`
              const preview = hoveredCells.has(cellKey)
              const clearing = clearingCells.has(cellKey)
              return (
                <button
                  key={cellKey}
                  data-board-cell data-row={row} data-col={col}
                  onClick={() => selectedPiece && placePiece(selectedPiece, row, col)}
                  aria-label={`${row + 1}행 ${col + 1}열`}
                  disabled={isResolving}
                  className="relative rounded-[5px] bg-black/15 shadow-[inset_0_2px_3px_rgba(0,0,0,.2),0_1px_0_rgba(255,255,255,.1)] overflow-hidden"
                >
                  <AnimatePresence>
                    {color && (
                      <motion.span
                        initial={{ scale: .35, opacity: 0 }}
                        animate={clearing
                          ? { scale: [1, 1.18, .15], rotate: [0, -4, 12], filter: ['brightness(1)', 'brightness(2.2)', 'brightness(3)'], opacity: [1, 1, 0] }
                          : { scale: 1, opacity: 1 }}
                        transition={{ duration: clearing ? .42 : .2, ease: 'easeOut' }}
                        className="absolute inset-[1px] rounded-[5px]"
                        style={{ background: `linear-gradient(145deg, rgba(255,255,255,.52), transparent 46%), ${color}`, boxShadow: `inset 0 -4px 0 color-mix(in srgb, ${color} 74%, black), inset 0 2px 0 rgba(255,255,255,.45)` }}
                      />
                    )}
                  </AnimatePresence>
                  {!color && preview && (
                    <motion.span
                      initial={{ scale: .7 }} animate={{ scale: 1 }}
                      className="absolute inset-[2px] rounded-[4px]"
                      style={{ background: validPreview ? selectedPiece?.color : '#fb7185', opacity: .55 }}
                    />
                  )}
                </button>
              )
            }))}
          </div>

          <AnimatePresence>
            {scoreBurst && (
              <motion.div
                key={scoreBurst.id}
                initial={{ opacity: 0, scale: .35, y: 15 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [.35, 1.18, 1, .9], y: [15, 0, -8, -32] }}
                transition={{ duration: 1.05, times: [0, .18, .7, 1] }}
                onAnimationComplete={() => setScoreBurst(null)}
                className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center drop-shadow-[0_4px_0_rgba(0,0,0,.3)]"
              >
                <strong className={`font-black text-3xl ${scoreBurst.label === '좋아요!' ? 'text-white' : 'text-amber-300'}`}>{scoreBurst.label}</strong>
                <span className="text-xl font-black text-white">+{scoreBurst.points}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {[...clearingCells].map((key, index) => {
              const [row, col] = key.split('-').map(Number)
              return (
                <motion.span
                  key={`spark-${key}`}
                  initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: .1, x: ((index % 5) - 2) * 22, y: ((index % 3) - 1) * 24 }}
                  transition={{ duration: .52, delay: (index % 4) * .025 }}
                  className="absolute z-30 w-2.5 h-2.5 bg-amber-200 rotate-45 pointer-events-none shadow-[0_0_10px_white]"
                  style={{ left: `${(col + .5) * 12.5}%`, top: `${(row + .5) * 12.5}%` }}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>

        <section className="w-full min-h-[116px] grid grid-cols-3 gap-3" aria-label="놓을 블록">
          {pieces.map(piece => (
            <motion.button
              key={piece.id}
              onPointerDown={event => {
                event.preventDefault()
                if (isResolving) return
                draggingRef.current = true
                setSelectedId(piece.id)
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={event => {
                if (!draggingRef.current) return
                setHovered(locateCell(event.clientX, event.clientY))
              }}
              onPointerUp={event => {
                if (!draggingRef.current) return
                draggingRef.current = false
                const target = locateCell(event.clientX, event.clientY)
                if (target) placePiece(piece, target.row, target.col)
              }}
              onPointerCancel={() => { draggingRef.current = false; setHovered(null) }}
              onClick={() => setSelectedId(piece.id)}
              animate={{ y: selectedId === piece.id ? -9 : 0, scale: selectedId === piece.id ? 1.04 : 1 }}
              whileTap={{ scale: .95 }}
              disabled={isResolving}
              className={`h-[106px] flex items-center justify-center rounded-[8px] border-2 bg-white/90 touch-none transition-colors shadow-[0_7px_0_rgba(15,118,110,.12)] ${selectedId === piece.id ? 'border-emerald-500' : 'border-white'}`}
              aria-label="블록 선택"
            >
              <PiecePreview piece={piece} selected={selectedId === piece.id} />
            </motion.button>
          ))}
        </section>
        <p className="text-xs font-semibold text-slate-400">블록을 끌거나 선택한 뒤 빈칸을 눌러요</p>
      </main>

      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-[#123b38]/70 backdrop-blur-sm flex items-center justify-center p-5">
            <motion.div initial={{ y: 24, scale: .92 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-xs bg-white rounded-[8px] p-7 text-center shadow-2xl">
              <Trophy size={52} className="mx-auto text-amber-400 mb-3" />
              <h2 className="text-2xl font-black text-slate-800">게임 종료!</h2>
              <p className="mt-1 text-slate-400 font-semibold">놓을 수 있는 블록이 없어요</p>
              <p className="my-6 text-4xl font-black text-emerald-600">{score.toLocaleString()}</p>
              <button onClick={restart} className="w-full py-3.5 bg-emerald-600 text-white rounded-[8px] font-black flex items-center justify-center gap-2"><RotateCcw size={18} /> 다시 하기</button>
              <Link to="/game" className="block mt-3 py-3 font-bold text-slate-500">게임 목록</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
