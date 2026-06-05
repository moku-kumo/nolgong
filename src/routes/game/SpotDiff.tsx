import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Search, Star, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCorrect, playWrong } from '@/lib/audio'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameTimer } from '@/hooks/useGameTimer'
import { randInt, shuffle } from '@/lib/random'

/* ================================================================
   SVG 테마별 틀린그림찾기
   테마: 숲, 바다, 우주, 도시, 농장, 수중
================================================================ */

const W = 540
const H = 420
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)]

/* ── 요소 타입 ── */
type ElemType =
  | 'sun' | 'moon' | 'cloud' | 'star'
  | 'tree' | 'palmTree' | 'cactus'
  | 'flower' | 'mushroom' | 'bush'
  | 'house' | 'building' | 'barn'
  | 'mountain' | 'bird' | 'fence' | 'butterfly'
  | 'pond' | 'boat' | 'wave' | 'fish' | 'crab' | 'shell' | 'umbrella' | 'sandcastle'
  | 'planet' | 'rocket' | 'ufo' | 'comet'
  | 'car' | 'streetlamp' | 'trafficLight'
  | 'cow' | 'chicken' | 'pig' | 'windmill' | 'haystack'
  | 'seaweed' | 'jellyfish' | 'octopus' | 'coral' | 'turtle' | 'bubbles'

interface SceneElem {
  id: string
  type: ElemType
  x: number; y: number; size: number
  color: string; color2?: string
}

interface Diff {
  elemId: string
  kind: 'color' | 'missing' | 'size'
  altColor?: string; altSize?: number
  cx: number; cy: number; r: number
}

interface Level {
  elems: SceneElem[]
  diffs: Diff[]
  bgColor: string
  groundColor: string
  theme: Theme
  groundY: number
}

type Theme = 'forest' | 'ocean' | 'space' | 'city' | 'farm' | 'underwater'

const THEME_NAMES: Record<Theme, string> = {
  forest: '🌲 숲',
  ocean: '🏖️ 바다',
  space: '🚀 우주',
  city: '🏙️ 도시',
  farm: '🐄 농장',
  underwater: '🐠 바닷속',
}

const THEMES: Theme[] = ['forest', 'ocean', 'space', 'city', 'farm', 'underwater']

/* ── SVG 요소 렌더러 ── */
function renderElem(e: SceneElem, oc?: string, os?: number, hidden?: boolean) {
  if (hidden) return null
  const c = oc ?? e.color
  const c2 = e.color2
  const s = os ?? e.size
  const k = e.id

  switch (e.type) {
    /* ── 공통 ── */
    case 'sun':
      return <g key={k}>
        {[0,45,90,135,180,225,270,315].map(a =>
          <line key={a} x1={e.x} y1={e.y} x2={e.x+Math.cos(a*Math.PI/180)*s*1.6} y2={e.y+Math.sin(a*Math.PI/180)*s*1.6} stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.5}/>
        )}
        <circle cx={e.x} cy={e.y} r={s} fill={c}/><circle cx={e.x-s*0.2} cy={e.y-s*0.15} r={s*0.15} fill="#FFF" opacity={0.5}/>
      </g>
    case 'moon':
      return <g key={k}>
        <circle cx={e.x} cy={e.y} r={s} fill={c}/>
        <circle cx={e.x+s*0.3} cy={e.y-s*0.2} r={s*0.8} fill={c2 ?? '#0B1D3A'}/>
      </g>
    case 'cloud':
      return <g key={k} opacity={0.85}>
        <ellipse cx={e.x} cy={e.y} rx={s*1.4} ry={s*0.7} fill={c}/>
        <ellipse cx={e.x-s*0.7} cy={e.y+s*0.1} rx={s*0.9} ry={s*0.55} fill={c}/>
        <ellipse cx={e.x+s*0.7} cy={e.y+s*0.1} rx={s*0.9} ry={s*0.55} fill={c}/>
        <ellipse cx={e.x-s*0.3} cy={e.y-s*0.3} rx={s*0.6} ry={s*0.5} fill={c}/>
      </g>
    case 'star':
      return <g key={k}><polygon points={starPoints(e.x,e.y,s,s*0.4,5)} fill={c}/></g>
    case 'bird':
      return <g key={k}>
        <path d={`M${e.x-s*0.6},${e.y+s*0.2}Q${e.x-s*0.3},${e.y-s*0.4} ${e.x},${e.y}`} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/>
        <path d={`M${e.x},${e.y}Q${e.x+s*0.3},${e.y-s*0.4} ${e.x+s*0.6},${e.y+s*0.2}`} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/>
      </g>
    case 'butterfly':
      return <g key={k}>
        <ellipse cx={e.x-s*0.35} cy={e.y-s*0.1} rx={s*0.4} ry={s*0.5} fill={c} opacity={0.8} transform={`rotate(-15 ${e.x-s*0.35} ${e.y-s*0.1})`}/>
        <ellipse cx={e.x+s*0.35} cy={e.y-s*0.1} rx={s*0.4} ry={s*0.5} fill={c} opacity={0.8} transform={`rotate(15 ${e.x+s*0.35} ${e.y-s*0.1})`}/>
        <ellipse cx={e.x} cy={e.y} rx={s*0.06} ry={s*0.3} fill="#333"/>
      </g>
    case 'mountain':
      return <g key={k}>
        <polygon points={`${e.x-s*1.5},${e.y+s} ${e.x},${e.y-s} ${e.x+s*1.5},${e.y+s}`} fill={c}/>
        <polygon points={`${e.x-s*0.3},${e.y-s*0.5} ${e.x},${e.y-s} ${e.x+s*0.3},${e.y-s*0.5}`} fill="#FFF" opacity={0.7}/>
      </g>

    /* ── 나무류 ── */
    case 'tree':
      return <g key={k}>
        <rect x={e.x-s*0.15} y={e.y-s*0.2} width={s*0.3} height={s*1.2} rx={3} fill={c2??'#8B4513'}/>
        <circle cx={e.x} cy={e.y-s*0.7} r={s*0.7} fill={c}/>
        <circle cx={e.x-s*0.4} cy={e.y-s*0.4} r={s*0.5} fill={c}/>
        <circle cx={e.x+s*0.4} cy={e.y-s*0.4} r={s*0.5} fill={c}/>
      </g>
    case 'palmTree':
      return <g key={k}>
        <path d={`M${e.x},${e.y+s*1.2} Q${e.x+s*0.3},${e.y+s*0.3} ${e.x+s*0.1},${e.y-s*0.5}`} stroke={c2??'#8B6914'} strokeWidth={s*0.25} fill="none" strokeLinecap="round"/>
        {[-50,-20,10,40,70].map((a,i) =>
          <ellipse key={i} cx={e.x+s*0.1+Math.cos(a*Math.PI/180)*s*0.8} cy={e.y-s*0.5+Math.sin(a*Math.PI/180)*s*0.6} rx={s*0.7} ry={s*0.15} fill={c} transform={`rotate(${a} ${e.x+s*0.1+Math.cos(a*Math.PI/180)*s*0.8} ${e.y-s*0.5+Math.sin(a*Math.PI/180)*s*0.6})`}/>
        )}
        <circle cx={e.x+s*0.05} cy={e.y-s*0.35} r={s*0.12} fill="#8B4513"/>
        <circle cx={e.x+s*0.2} cy={e.y-s*0.4} r={s*0.1} fill="#8B4513"/>
      </g>
    case 'cactus':
      return <g key={k}>
        <rect x={e.x-s*0.2} y={e.y-s*0.8} width={s*0.4} height={s*1.6} rx={s*0.2} fill={c}/>
        <rect x={e.x-s*0.6} y={e.y-s*0.3} width={s*0.5} height={s*0.2} rx={s*0.1} fill={c}/>
        <rect x={e.x-s*0.6} y={e.y-s*0.3} width={s*0.2} height={s*-0.5} rx={s*0.1} fill={c}/>
        <rect x={e.x+s*0.2} y={e.y-s*0.5} width={s*0.5} height={s*0.2} rx={s*0.1} fill={c}/>
        <rect x={e.x+s*0.5} y={e.y-s*0.5} width={s*0.2} height={s*-0.4} rx={s*0.1} fill={c}/>
        <circle cx={e.x} cy={e.y-s*0.85} r={s*0.15} fill="#FF6B8A"/>
      </g>

    /* ── 식물 ── */
    case 'flower': {
      const pr = s*0.45
      return <g key={k}>
        <line x1={e.x} y1={e.y} x2={e.x} y2={e.y+s*1.5} stroke="#2E8B57" strokeWidth={2}/>
        {Array.from({length:5}).map((_,i) => {
          const a=(i*72)-90; const px=e.x+Math.cos(a*Math.PI/180)*pr; const py=e.y+Math.sin(a*Math.PI/180)*pr
          return <ellipse key={i} cx={px} cy={py} rx={s*0.35} ry={s*0.2} fill={c} transform={`rotate(${a} ${px} ${py})`}/>
        })}
        <circle cx={e.x} cy={e.y} r={s*0.2} fill="#FFD700"/>
      </g>
    }
    case 'mushroom':
      return <g key={k}>
        <rect x={e.x-s*0.15} y={e.y} width={s*0.3} height={s*0.6} fill="#F5DEB3"/>
        <ellipse cx={e.x} cy={e.y} rx={s*0.55} ry={s*0.35} fill={c}/>
        <circle cx={e.x-s*0.15} cy={e.y-s*0.1} r={s*0.1} fill="#FFF" opacity={0.7}/>
        <circle cx={e.x+s*0.2} cy={e.y+s*0.05} r={s*0.07} fill="#FFF" opacity={0.7}/>
      </g>
    case 'bush':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s} ry={s*0.6} fill={c}/>
        <ellipse cx={e.x-s*0.5} cy={e.y-s*0.1} rx={s*0.6} ry={s*0.45} fill={c}/>
        <ellipse cx={e.x+s*0.5} cy={e.y-s*0.1} rx={s*0.6} ry={s*0.45} fill={c}/>
      </g>

    /* ── 건물 ── */
    case 'house':
      return <g key={k}>
        <rect x={e.x-s} y={e.y-s*0.8} width={s*2} height={s*1.4} rx={3} fill={c}/>
        <polygon points={`${e.x-s*1.3},${e.y-s*0.8} ${e.x},${e.y-s*1.8} ${e.x+s*1.3},${e.y-s*0.8}`} fill={c2??'#B22222'}/>
        <rect x={e.x-s*0.2} y={e.y-s*0.1} width={s*0.4} height={s*0.7} rx={s*0.2} fill="#5C4033"/>
        <rect x={e.x-s*0.7} y={e.y-s*0.55} width={s*0.35} height={s*0.3} rx={2} fill="#87CEEB" stroke="#FFF" strokeWidth={1.5}/>
        <rect x={e.x+s*0.35} y={e.y-s*0.55} width={s*0.35} height={s*0.3} rx={2} fill="#87CEEB" stroke="#FFF" strokeWidth={1.5}/>
      </g>
    case 'building': {
      const winColors = ['#FFD700','#87CEEB','#333']
      return <g key={k}>
        <rect x={e.x-s*0.7} y={e.y-s*2} width={s*1.4} height={s*2.5} rx={2} fill={c}/>
        {Array.from({length:4}).map((_,row) =>
          Array.from({length:2}).map((_,col) =>
            <rect key={`${row}-${col}`} x={e.x-s*0.45+col*s*0.6} y={e.y-s*1.8+row*s*0.5} width={s*0.3} height={s*0.25} rx={1} fill={winColors[(row*2+col) % winColors.length]} opacity={0.8}/>
          )
        )}
      </g>
    }
    case 'barn':
      return <g key={k}>
        <rect x={e.x-s} y={e.y-s*0.6} width={s*2} height={s*1.2} fill={c}/>
        <polygon points={`${e.x-s*1.1},${e.y-s*0.6} ${e.x},${e.y-s*1.5} ${e.x+s*1.1},${e.y-s*0.6}`} fill={c}/>
        <line x1={e.x} y1={e.y-s*1.5} x2={e.x} y2={e.y+s*0.6} stroke="#FFF" strokeWidth={2} opacity={0.4}/>
        <rect x={e.x-s*0.3} y={e.y-s*0.1} width={s*0.6} height={s*0.7} rx={s*0.3} fill="#5C4033"/>
      </g>

    /* ── 울타리/연못 ── */
    case 'fence':
      return <g key={k}>
        <rect x={e.x-s} y={e.y-s*0.3} width={s*2} height={s*0.12} fill={c} rx={1}/>
        <rect x={e.x-s} y={e.y+s*0.15} width={s*2} height={s*0.12} fill={c} rx={1}/>
        {Array.from({length:4}).map((_,i) => {
          const px=e.x-s+(i*s*2)/3
          return <rect key={i} x={px-s*0.06} y={e.y-s*0.5} width={s*0.12} height={s*0.9} fill={c} rx={1}/>
        })}
      </g>
    case 'pond':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*1.2} ry={s*0.6} fill={c} opacity={0.7}/>
        <ellipse cx={e.x+s*0.2} cy={e.y-s*0.1} rx={s*0.4} ry={s*0.15} fill="#FFF" opacity={0.2}/>
      </g>

    /* ── 바다 테마 ── */
    case 'wave':
      return <g key={k} opacity={0.5}>
        <path d={`M${e.x-s},${e.y} Q${e.x-s*0.5},${e.y-s*0.5} ${e.x},${e.y} Q${e.x+s*0.5},${e.y+s*0.5} ${e.x+s},${e.y}`} stroke={c} strokeWidth={2.5} fill="none" strokeLinecap="round"/>
      </g>
    case 'boat':
      return <g key={k}>
        <path d={`M${e.x-s},${e.y} L${e.x-s*0.7},${e.y+s*0.6} L${e.x+s*0.7},${e.y+s*0.6} L${e.x+s},${e.y} Z`} fill={c}/>
        <line x1={e.x} y1={e.y+s*0.3} x2={e.x} y2={e.y-s} stroke="#8B4513" strokeWidth={2}/>
        <polygon points={`${e.x},${e.y-s} ${e.x},${e.y+s*0.2} ${e.x+s*0.6},${e.y+s*0.1}`} fill={c2??'#FFF'} opacity={0.9}/>
      </g>
    case 'fish':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.6} ry={s*0.3} fill={c}/>
        <polygon points={`${e.x+s*0.5},${e.y} ${e.x+s*0.9},${e.y-s*0.3} ${e.x+s*0.9},${e.y+s*0.3}`} fill={c}/>
        <circle cx={e.x-s*0.25} cy={e.y-s*0.05} r={s*0.08} fill="#FFF"/>
        <circle cx={e.x-s*0.25} cy={e.y-s*0.05} r={s*0.04} fill="#000"/>
      </g>
    case 'crab':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.5} ry={s*0.35} fill={c}/>
        <circle cx={e.x-s*0.25} cy={e.y-s*0.1} r={s*0.06} fill="#000"/>
        <circle cx={e.x+s*0.25} cy={e.y-s*0.1} r={s*0.06} fill="#000"/>
        {[-1,1].map(d => [0.2,0.4,0.6].map((off,i) =>
          <line key={`${d}-${i}`} x1={e.x+d*s*0.4} y1={e.y+s*off*0.5} x2={e.x+d*s*0.8} y2={e.y+s*(off*0.5+0.15)} stroke={c} strokeWidth={2} strokeLinecap="round"/>
        ))}
        <circle cx={e.x-s*0.7} cy={e.y-s*0.2} r={s*0.15} fill={c}/>
        <circle cx={e.x+s*0.7} cy={e.y-s*0.2} r={s*0.15} fill={c}/>
      </g>
    case 'shell':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.5} ry={s*0.4} fill={c}/>
        {[0,1,2].map(i =>
          <path key={i} d={`M${e.x},${e.y+s*0.3} Q${e.x+s*(i*0.15-0.15)},${e.y-s*0.1} ${e.x+s*(i*0.2-0.2)},${e.y-s*0.35}`} stroke="#FFF" strokeWidth={1} fill="none" opacity={0.4}/>
        )}
      </g>
    case 'umbrella':
      return <g key={k}>
        <line x1={e.x} y1={e.y-s*0.8} x2={e.x} y2={e.y+s*0.8} stroke="#8B4513" strokeWidth={2.5}/>
        <path d={`M${e.x-s},${e.y-s*0.5} Q${e.x-s*0.5},${e.y-s*1.5} ${e.x},${e.y-s*0.8} Q${e.x+s*0.5},${e.y-s*1.5} ${e.x+s},${e.y-s*0.5}`} fill={c}/>
      </g>
    case 'sandcastle':
      return <g key={k}>
        <rect x={e.x-s*0.8} y={e.y-s*0.3} width={s*1.6} height={s*0.7} fill={c} rx={2}/>
        <rect x={e.x-s*0.6} y={e.y-s*0.7} width={s*0.35} height={s*0.5} fill={c}/>
        <rect x={e.x+s*0.25} y={e.y-s*0.7} width={s*0.35} height={s*0.5} fill={c}/>
        <rect x={e.x-s*0.15} y={e.y-s*1} width={s*0.3} height={s*0.8} fill={c}/>
        <line x1={e.x} y1={e.y-s*1} x2={e.x} y2={e.y-s*1.3} stroke="#8B4513" strokeWidth={1.5}/>
        <polygon points={`${e.x},${e.y-s*1.3} ${e.x+s*0.25},${e.y-s*1.15} ${e.x},${e.y-s*1}`} fill="#FF4500"/>
      </g>

    /* ── 우주 테마 ── */
    case 'planet':
      return <g key={k}>
        <circle cx={e.x} cy={e.y} r={s} fill={c}/>
        <ellipse cx={e.x} cy={e.y} rx={s*1.6} ry={s*0.3} fill="none" stroke={c2??'#DDD'} strokeWidth={2.5} opacity={0.6}/>
        <circle cx={e.x-s*0.2} cy={e.y-s*0.3} r={s*0.2} fill="#FFF" opacity={0.15}/>
      </g>
    case 'rocket':
      return <g key={k}>
        <rect x={e.x-s*0.25} y={e.y-s*0.6} width={s*0.5} height={s*1.2} rx={s*0.25} fill={c}/>
        <polygon points={`${e.x-s*0.25},${e.y-s*0.6} ${e.x},${e.y-s*1.2} ${e.x+s*0.25},${e.y-s*0.6}`} fill={c2??'#FF4500'}/>
        <polygon points={`${e.x-s*0.25},${e.y+s*0.4} ${e.x-s*0.55},${e.y+s*0.7} ${e.x-s*0.25},${e.y+s*0.1}`} fill={c2??'#FF4500'}/>
        <polygon points={`${e.x+s*0.25},${e.y+s*0.4} ${e.x+s*0.55},${e.y+s*0.7} ${e.x+s*0.25},${e.y+s*0.1}`} fill={c2??'#FF4500'}/>
        <circle cx={e.x} cy={e.y-s*0.15} r={s*0.15} fill="#87CEEB"/>
        <ellipse cx={e.x} cy={e.y+s*0.8} rx={s*0.15} ry={s*0.3} fill="#FFA500" opacity={0.8}/>
        <ellipse cx={e.x} cy={e.y+s*0.7} rx={s*0.08} ry={s*0.2} fill="#FFD700"/>
      </g>
    case 'ufo':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*1.2} ry={s*0.3} fill={c} opacity={0.8}/>
        <ellipse cx={e.x} cy={e.y-s*0.15} rx={s*0.6} ry={s*0.45} fill={c2??'#C0C0C0'}/>
        <circle cx={e.x} cy={e.y-s*0.2} r={s*0.15} fill="#87CEEB" opacity={0.7}/>
        {[-0.6,0,0.6].map((off,i) =>
          <circle key={i} cx={e.x+s*off} cy={e.y+s*0.1} r={s*0.08} fill="#FFD700" opacity={0.7}/>
        )}
      </g>
    case 'comet':
      return <g key={k}>
        <circle cx={e.x} cy={e.y} r={s*0.3} fill={c}/>
        <path d={`M${e.x+s*0.2},${e.y} Q${e.x+s},${e.y+s*0.1} ${e.x+s*2},${e.y+s*0.3}`} stroke={c} strokeWidth={s*0.15} fill="none" opacity={0.4} strokeLinecap="round"/>
      </g>

    /* ── 도시 테마 ── */
    case 'car':
      return <g key={k}>
        <rect x={e.x-s*0.8} y={e.y-s*0.2} width={s*1.6} height={s*0.5} rx={3} fill={c}/>
        <rect x={e.x-s*0.5} y={e.y-s*0.55} width={s*1} height={s*0.4} rx={s*0.1} fill={c} opacity={0.85}/>
        <rect x={e.x-s*0.35} y={e.y-s*0.5} width={s*0.3} height={s*0.3} fill="#B0E0E6" rx={1}/>
        <rect x={e.x+s*0.05} y={e.y-s*0.5} width={s*0.3} height={s*0.3} fill="#B0E0E6" rx={1}/>
        <circle cx={e.x-s*0.45} cy={e.y+s*0.3} r={s*0.18} fill="#333"/>
        <circle cx={e.x+s*0.45} cy={e.y+s*0.3} r={s*0.18} fill="#333"/>
      </g>
    case 'streetlamp':
      return <g key={k}>
        <rect x={e.x-s*0.06} y={e.y-s*1.5} width={s*0.12} height={s*2} fill="#555"/>
        <circle cx={e.x} cy={e.y-s*1.5} r={s*0.2} fill={c}/>
        <circle cx={e.x} cy={e.y-s*1.5} r={s*0.35} fill={c} opacity={0.2}/>
      </g>
    case 'trafficLight':
      return <g key={k}>
        <rect x={e.x-s*0.05} y={e.y-s*1.2} width={s*0.1} height={s*1.5} fill="#555"/>
        <rect x={e.x-s*0.2} y={e.y-s*1.2} width={s*0.4} height={s*0.8} rx={s*0.1} fill="#333"/>
        <circle cx={e.x} cy={e.y-s*1} r={s*0.1} fill={c === '#22c55e' ? '#22c55e' : '#555'}/>
        <circle cx={e.x} cy={e.y-s*0.75} r={s*0.1} fill={c === '#EAB308' ? '#EAB308' : '#555'}/>
        <circle cx={e.x} cy={e.y-s*0.5} r={s*0.1} fill={c === '#EF4444' ? '#EF4444' : '#555'}/>
      </g>

    /* ── 농장 테마 ── */
    case 'cow':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.7} ry={s*0.45} fill="#FFF"/>
        <circle cx={e.x-s*0.6} cy={e.y-s*0.15} r={s*0.3} fill="#FFF"/>
        <ellipse cx={e.x+s*0.1} cy={e.y-s*0.1} rx={s*0.2} ry={s*0.15} fill={c}/>
        <ellipse cx={e.x-s*0.25} cy={e.y+s*0.1} rx={s*0.15} ry={s*0.1} fill={c}/>
        <circle cx={e.x-s*0.7} cy={e.y-s*0.25} r={s*0.06} fill="#000"/>
        {[-0.4,-0.15,0.15,0.4].map((off,i) =>
          <rect key={i} x={e.x+s*off-s*0.04} y={e.y+s*0.35} width={s*0.08} height={s*0.35} fill="#333"/>
        )}
      </g>
    case 'chicken':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.4} ry={s*0.35} fill={c}/>
        <circle cx={e.x-s*0.3} cy={e.y-s*0.2} r={s*0.2} fill={c}/>
        <polygon points={`${e.x-s*0.45},${e.y-s*0.15} ${e.x-s*0.65},${e.y-s*0.1} ${e.x-s*0.45},${e.y-s*0.05}`} fill="#FFA500"/>
        <circle cx={e.x-s*0.25} cy={e.y-s*0.4} r={s*0.1} fill="#FF0000"/>
        <circle cx={e.x-s*0.35} cy={e.y-s*0.25} r={s*0.04} fill="#000"/>
        <line x1={e.x-s*0.1} y1={e.y+s*0.3} x2={e.x-s*0.15} y2={e.y+s*0.6} stroke="#FFA500" strokeWidth={1.5}/>
        <line x1={e.x+s*0.1} y1={e.y+s*0.3} x2={e.x+s*0.05} y2={e.y+s*0.6} stroke="#FFA500" strokeWidth={1.5}/>
      </g>
    case 'pig':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.55} ry={s*0.45} fill={c}/>
        <ellipse cx={e.x} cy={e.y+s*0.1} rx={s*0.2} ry={s*0.13} fill="#D4869A"/>
        <circle cx={e.x-s*0.07} cy={e.y+s*0.1} r={s*0.04} fill="#B05C73"/>
        <circle cx={e.x+s*0.07} cy={e.y+s*0.1} r={s*0.04} fill="#B05C73"/>
        <circle cx={e.x-s*0.2} cy={e.y-s*0.1} r={s*0.06} fill="#000"/>
        <circle cx={e.x+s*0.2} cy={e.y-s*0.1} r={s*0.06} fill="#000"/>
        <ellipse cx={e.x-s*0.3} cy={e.y-s*0.35} rx={s*0.15} ry={s*0.2} fill={c} transform={`rotate(-20 ${e.x-s*0.3} ${e.y-s*0.35})`}/>
        <ellipse cx={e.x+s*0.3} cy={e.y-s*0.35} rx={s*0.15} ry={s*0.2} fill={c} transform={`rotate(20 ${e.x+s*0.3} ${e.y-s*0.35})`}/>
      </g>
    case 'windmill':
      return <g key={k}>
        <rect x={e.x-s*0.15} y={e.y-s*0.5} width={s*0.3} height={s*1.5} fill="#DEB887"/>
        <polygon points={`${e.x-s*0.3},${e.y+s} ${e.x},${e.y-s*0.5} ${e.x+s*0.3},${e.y+s}`} fill="#DEB887"/>
        {[0,90,180,270].map(a =>
          <rect key={a} x={e.x-s*0.08} y={e.y-s*0.5-s*0.8} width={s*0.16} height={s*0.8} rx={2} fill={c} transform={`rotate(${a} ${e.x} ${e.y-s*0.5})`}/>
        )}
        <circle cx={e.x} cy={e.y-s*0.5} r={s*0.1} fill="#8B4513"/>
      </g>
    case 'haystack':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y+s*0.2} rx={s*0.7} ry={s*0.3} fill={c}/>
        <ellipse cx={e.x} cy={e.y-s*0.1} rx={s*0.55} ry={s*0.35} fill={c}/>
        <ellipse cx={e.x} cy={e.y-s*0.35} rx={s*0.35} ry={s*0.2} fill={c}/>
      </g>

    /* ── 수중 테마 ── */
    case 'seaweed':
      return <g key={k}>
        <path d={`M${e.x},${e.y+s} Q${e.x+s*0.3},${e.y+s*0.5} ${e.x},${e.y} Q${e.x-s*0.3},${e.y-s*0.5} ${e.x},${e.y-s}`} stroke={c} strokeWidth={s*0.2} fill="none" strokeLinecap="round"/>
        <path d={`M${e.x+s*0.2},${e.y+s*0.8} Q${e.x+s*0.5},${e.y+s*0.3} ${e.x+s*0.2},${e.y-s*0.2}`} stroke={c} strokeWidth={s*0.15} fill="none" strokeLinecap="round" opacity={0.7}/>
      </g>
    case 'jellyfish':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.5} ry={s*0.4} fill={c} opacity={0.7}/>
        {[-0.3,-0.1,0.1,0.3].map((off,i) =>
          <path key={i} d={`M${e.x+s*off},${e.y+s*0.3} Q${e.x+s*off+s*0.1},${e.y+s*0.6} ${e.x+s*off},${e.y+s*0.9}`} stroke={c} strokeWidth={1.5} fill="none" opacity={0.5}/>
        )}
      </g>
    case 'octopus':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.5} ry={s*0.45} fill={c}/>
        <circle cx={e.x-s*0.2} cy={e.y-s*0.1} r={s*0.1} fill="#FFF"/>
        <circle cx={e.x+s*0.2} cy={e.y-s*0.1} r={s*0.1} fill="#FFF"/>
        <circle cx={e.x-s*0.2} cy={e.y-s*0.1} r={s*0.05} fill="#000"/>
        <circle cx={e.x+s*0.2} cy={e.y-s*0.1} r={s*0.05} fill="#000"/>
        {[-0.4,-0.25,-0.1,0.05,0.2,0.35].map((off,i) =>
          <path key={i} d={`M${e.x+s*off},${e.y+s*0.35} Q${e.x+s*off+(i%2?0.15:-0.15)*s},${e.y+s*0.7} ${e.x+s*off},${e.y+s*1}`} stroke={c} strokeWidth={s*0.08} fill="none" strokeLinecap="round"/>
        )}
      </g>
    case 'coral':
      return <g key={k}>
        <path d={`M${e.x},${e.y+s*0.5} L${e.x},${e.y} L${e.x-s*0.3},${e.y-s*0.4}`} stroke={c} strokeWidth={s*0.15} fill="none" strokeLinecap="round"/>
        <path d={`M${e.x},${e.y} L${e.x+s*0.35},${e.y-s*0.35}`} stroke={c} strokeWidth={s*0.12} fill="none" strokeLinecap="round"/>
        <path d={`M${e.x},${e.y+s*0.2} L${e.x-s*0.4},${e.y+s*0.05}`} stroke={c} strokeWidth={s*0.1} fill="none" strokeLinecap="round"/>
        <circle cx={e.x-s*0.3} cy={e.y-s*0.4} r={s*0.12} fill={c}/>
        <circle cx={e.x+s*0.35} cy={e.y-s*0.35} r={s*0.1} fill={c}/>
      </g>
    case 'turtle':
      return <g key={k}>
        <ellipse cx={e.x} cy={e.y} rx={s*0.6} ry={s*0.45} fill={c}/>
        <ellipse cx={e.x} cy={e.y} rx={s*0.5} ry={s*0.35} fill={c2??'#2E8B57'}/>
        <circle cx={e.x-s*0.55} cy={e.y} r={s*0.18} fill={c}/>
        <circle cx={e.x-s*0.6} cy={e.y-s*0.05} r={s*0.04} fill="#000"/>
        <ellipse cx={e.x-s*0.3} cy={e.y+s*0.4} rx={s*0.15} ry={s*0.08} fill={c}/>
        <ellipse cx={e.x+s*0.3} cy={e.y+s*0.4} rx={s*0.15} ry={s*0.08} fill={c}/>
        <circle cx={e.x} cy={e.y} r={s*0.12} fill={c} opacity={0.5}/>
      </g>
    case 'bubbles':
      return <g key={k}>
        <circle cx={e.x} cy={e.y} r={s*0.3} fill="none" stroke="#FFF" strokeWidth={1} opacity={0.5}/>
        <circle cx={e.x+s*0.3} cy={e.y-s*0.4} r={s*0.2} fill="none" stroke="#FFF" strokeWidth={1} opacity={0.4}/>
        <circle cx={e.x-s*0.2} cy={e.y-s*0.5} r={s*0.15} fill="none" stroke="#FFF" strokeWidth={1} opacity={0.3}/>
      </g>

    default: return null
  }
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number, pts: number) {
  return Array.from({length: pts*2}).map((_, i) => {
    const r = i%2===0 ? outerR : innerR
    const a = (i*Math.PI/pts) - Math.PI/2
    return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`
  }).join(' ')
}

/* ================================================================
   테마별 장면 생성
================================================================ */

// 좌표를 1.5배 스케일 (기존 360x280 → 540x420)
const S = 1.5

// 겹침 방지: 기존 요소들과 거리 체크
function findNonOverlapping(
  elems: SceneElem[],
  x: number, y: number, size: number,
  minDist = 30,
): { x: number; y: number } {
  let bx = x, by = y
  for (let attempt = 0; attempt < 8; attempt++) {
    let ok = true
    for (const e of elems) {
      const dx = bx - e.x, dy = by - e.y
      const needed = (size + e.size) * 0.7 + minDist
      if (Math.sqrt(dx * dx + dy * dy) < needed) { ok = false; break }
    }
    if (ok) return { x: bx, y: by }
    bx = x + (Math.random() - 0.5) * 80 * S
    by = y + (Math.random() - 0.5) * 40 * S
    // 화면 내 유지
    bx = Math.max(20, Math.min(W - 20, bx))
    by = Math.max(20, Math.min(H - 20, by))
  }
  return { x: bx, y: by }
}

function addElem(
  elems: SceneElem[],
  elem: Omit<SceneElem, 'x' | 'y'> & { x: number; y: number },
  avoidOverlap = true,
) {
  if (avoidOverlap) {
    const pos = findNonOverlapping(elems, elem.x, elem.y, elem.size)
    elems.push({ ...elem, x: pos.x, y: pos.y })
  } else {
    elems.push(elem as SceneElem)
  }
}

function generateScene(round: number): Level {
  const theme = THEMES[round % THEMES.length]
  const elems: SceneElem[] = []
  let idC = 0
  const id = () => `e${idC++}`

  let bgColor: string
  let groundColor: string
  let groundY = Math.round(170 * S)

  // 스케일된 randInt
  const sr = (a: number, b: number) => randInt(Math.round(a * S), Math.round(b * S))

  switch (theme) {
    case 'forest': {
      bgColor = pick(['#87CEEB', '#B0E0E6', '#ADD8E6'])
      groundColor = pick(['#90EE90', '#7CCD7C', '#8FBC8F'])
      addElem(elems, { id: id(), type: 'sun', x: sr(40,80), y: sr(25,50), size: sr(18,24), color: pick(['#FFD700','#FFA500']) }, false)
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'cloud', x: sr(80+i*100,150+i*100), y: sr(20,60), size: sr(14,20), color: pick(['#FFF','#F0F0F0']) }, false)
      if (Math.random()>0.4) for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'mountain', x: sr(50+i*150,180+i*150), y: sr(125,150), size: sr(40,60), color: pick(['#6B8E23','#808080','#696969']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'house', x: sr(100,260), y: sr(170,190), size: sr(22,28), color: pick(['#FFD700','#DEB887','#F4A460']), color2: pick(['#B22222','#8B0000','#CD5C5C']) })
      for (let i=0; i<randInt(2,4); i++)
        addElem(elems, { id: id(), type: 'tree', x: sr(20+i*80,70+i*80), y: sr(180,205), size: sr(18,28), color: pick(['#228B22','#2E8B57','#3CB371']), color2: pick(['#8B4513','#A0522D']) })
      for (let i=0; i<randInt(2,5); i++)
        addElem(elems, { id: id(), type: 'flower', x: sr(20,340), y: sr(220,250), size: sr(6,10), color: pick(['#FF6B8A','#FFD700','#FF69B4','#DA70D6','#FF4500']) })
      if (Math.random()>0.5) for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'mushroom', x: sr(30,330), y: sr(225,250), size: sr(8,12), color: pick(['#FF4500','#FF6347','#DC143C']) })
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'bird', x: sr(100,300), y: sr(40,100), size: sr(6,10), color: '#333' }, false)
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'butterfly', x: sr(50,310), y: sr(130,200), size: sr(8,13), color: pick(['#FF69B4','#9370DB','#FFD700','#00CED1']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'bush', x: sr(40,320), y: sr(215,240), size: sr(14,20), color: pick(['#228B22','#2E8B57']) })
      if (Math.random()>0.5) addElem(elems, { id: id(), type: 'pond', x: sr(80,280), y: sr(230,255), size: sr(18,26), color: pick(['#4169E1','#1E90FF']) })
      break
    }
    case 'ocean': {
      bgColor = pick(['#87CEEB', '#B0E0E6'])
      groundColor = pick(['#F4D790', '#EDC9AF', '#DEB887'])
      groundY = Math.round(180 * S)
      addElem(elems, { id: id(), type: 'sun', x: sr(250,320), y: sr(30,55), size: sr(22,28), color: '#FFD700' }, false)
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'cloud', x: sr(40+i*100,120+i*100), y: sr(20,55), size: sr(12,18), color: '#FFF' }, false)
      for (let i=0; i<randInt(2,4); i++)
        addElem(elems, { id: id(), type: 'wave', x: sr(40+i*70,100+i*70), y: sr(155,175), size: sr(25,40), color: pick(['#4169E1','#1E90FF','#6495ED']) }, false)
      if (Math.random()>0.3) addElem(elems, { id: id(), type: 'boat', x: sr(80,280), y: sr(120,150), size: sr(18,25), color: pick(['#8B4513','#CD853F','#A0522D']), color2: '#FFF' })
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'palmTree', x: sr(20+i*200,100+i*200), y: sr(180,200), size: sr(20,28), color: '#228B22', color2: '#8B6914' })
      if (Math.random()>0.3) addElem(elems, { id: id(), type: 'umbrella', x: sr(120,240), y: sr(200,220), size: sr(16,22), color: pick(['#FF4500','#FF69B4','#4169E1','#FFD700']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'sandcastle', x: sr(100,260), y: sr(225,245), size: sr(12,18), color: '#DEB887' })
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'shell', x: sr(30,330), y: sr(240,260), size: sr(6,10), color: pick(['#FFB6C1','#DDA0DD','#FFF0F5','#FFDAB9']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'crab', x: sr(50,310), y: sr(230,255), size: sr(8,13), color: pick(['#FF4500','#FF6347','#E8672C']) })
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'bird', x: sr(50,310), y: sr(30,80), size: sr(5,8), color: '#333' }, false)
      break
    }
    case 'space': {
      bgColor = pick(['#0B1D3A', '#0D0D2B', '#1A0A2E'])
      groundColor = pick(['#4A4A6A', '#3D3D5C', '#555577'])
      groundY = Math.round(200 * S)
      addElem(elems, { id: id(), type: 'moon', x: sr(40,100), y: sr(30,60), size: sr(20,28), color: '#F5F5DC', color2: bgColor }, false)
      for (let i=0; i<randInt(5,10); i++)
        addElem(elems, { id: id(), type: 'star', x: sr(10,350), y: sr(10,160), size: sr(3,7), color: pick(['#FFD700','#FFF','#FFFACD','#ADD8E6']) }, false)
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'planet', x: sr(150+i*100,250+i*80), y: sr(40,100), size: sr(15,25), color: pick(['#FF6347','#4169E1','#32CD32','#DA70D6','#FF8C00']), color2: pick(['#DDD','#AAA','#FFD700']) })
      if (Math.random()>0.3) addElem(elems, { id: id(), type: 'rocket', x: sr(80,280), y: sr(80,150), size: sr(16,22), color: '#E8E8E8', color2: '#FF4500' })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'ufo', x: sr(60,300), y: sr(50,120), size: sr(14,20), color: pick(['#C0C0C0','#90EE90','#9370DB']), color2: '#C0C0C0' })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'comet', x: sr(50,200), y: sr(30,80), size: sr(8,14), color: pick(['#FFD700','#87CEEB','#FFF']) })
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'mountain', x: sr(40+i*120,140+i*120), y: sr(200,225), size: sr(20,35), color: pick(['#5A5A7A','#6B6B8D','#4A4A6A']) })
      break
    }
    case 'city': {
      bgColor = pick(['#FFB347', '#FF7F50', '#87CEEB', '#FFA07A'])
      groundColor = pick(['#808080', '#696969', '#778899'])
      groundY = Math.round(185 * S)
      if (bgColor.startsWith('#FF'))
        addElem(elems, { id: id(), type: 'sun', x: sr(150,210), y: sr(50,80), size: sr(25,35), color: '#FFD700' }, false)
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'cloud', x: sr(30+i*100,100+i*100), y: sr(20,60), size: sr(12,18), color: '#FFF' }, false)
      for (let i=0; i<randInt(3,5); i++)
        addElem(elems, { id: id(), type: 'building', x: sr(20+i*65,60+i*65), y: sr(160,185), size: sr(18,28), color: pick(['#4A5568','#2D3748','#718096','#A0AEC0','#E2E8F0','#CBD5E0']) })
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'streetlamp', x: sr(30+i*200,120+i*200), y: sr(210,230), size: sr(12,16), color: '#FFD700' })
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'car', x: sr(60+i*150,180+i*150), y: sr(235,250), size: sr(14,20), color: pick(['#FF4500','#4169E1','#FFD700','#32CD32','#FF69B4']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'trafficLight', x: sr(100,260), y: sr(210,230), size: sr(12,16), color: pick(['#22c55e','#EAB308','#EF4444']) })
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'tree', x: sr(40+i*200,130+i*200), y: sr(205,220), size: sr(12,18), color: '#228B22', color2: '#8B4513' })
      for (let i=0; i<randInt(0,2); i++)
        addElem(elems, { id: id(), type: 'bird', x: sr(50,310), y: sr(30,80), size: sr(5,8), color: '#333' }, false)
      break
    }
    case 'farm': {
      bgColor = pick(['#87CEEB', '#B0E0E6'])
      groundColor = pick(['#90EE90', '#7CCD7C', '#8DB600'])
      groundY = Math.round(170 * S)
      addElem(elems, { id: id(), type: 'sun', x: sr(280,330), y: sr(25,50), size: sr(20,26), color: '#FFD700' }, false)
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'cloud', x: sr(50+i*120,150+i*120), y: sr(20,50), size: sr(14,20), color: '#FFF' }, false)
      addElem(elems, { id: id(), type: 'barn', x: sr(60,150), y: sr(165,180), size: sr(25,32), color: pick(['#B22222','#CD5C5C','#8B0000']) })
      if (Math.random()>0.3) addElem(elems, { id: id(), type: 'windmill', x: sr(230,310), y: sr(175,195), size: sr(18,24), color: '#FFF' })
      addElem(elems, { id: id(), type: 'fence', x: sr(140,250), y: sr(205,215), size: sr(30,45), color: pick(['#DEB887','#D2B48C']) })
      if (Math.random()>0.3) addElem(elems, { id: id(), type: 'cow', x: sr(140,260), y: sr(215,235), size: sr(14,20), color: '#333' })
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'chicken', x: sr(50+i*80,120+i*80), y: sr(225,250), size: sr(8,12), color: pick(['#FFF','#F5DEB3','#DEB887']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'pig', x: sr(200,300), y: sr(230,250), size: sr(12,18), color: pick(['#FFB6C1','#FFC0CB']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'haystack', x: sr(40,320), y: sr(220,245), size: sr(14,20), color: pick(['#DAA520','#B8860B','#D2B48C']) })
      for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'tree', x: sr(20+i*250,80+i*250), y: sr(180,200), size: sr(16,24), color: pick(['#228B22','#2E8B57']), color2: '#8B4513' })
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'flower', x: sr(20,340), y: sr(230,255), size: sr(5,8), color: pick(['#FF6B8A','#FFD700','#FF4500','#DA70D6']) })
      break
    }
    case 'underwater': {
      bgColor = pick(['#1A5276', '#1B4F72', '#154360'])
      groundColor = pick(['#F4D790', '#DEB887', '#C4A882'])
      groundY = Math.round(210 * S)
      for (let i=0; i<randInt(2,4); i++)
        addElem(elems, { id: id(), type: 'wave', x: sr(30+i*80,100+i*80), y: sr(10,30), size: sr(30,50), color: pick(['#2E86C1','#3498DB']) }, false)
      for (let i=0; i<randInt(3,6); i++)
        addElem(elems, { id: id(), type: 'seaweed', x: sr(15+i*55,45+i*55), y: sr(180,220), size: sr(20,35), color: pick(['#228B22','#2E8B57','#006400','#3CB371']) })
      for (let i=0; i<randInt(2,4); i++)
        addElem(elems, { id: id(), type: 'coral', x: sr(20+i*80,80+i*80), y: sr(220,255), size: sr(12,20), color: pick(['#FF6B8A','#FF4500','#FF69B4','#FFA500','#DA70D6']) })
      for (let i=0; i<randInt(2,4); i++)
        addElem(elems, { id: id(), type: 'fish', x: sr(30,330), y: sr(60,180), size: sr(10,18), color: pick(['#FFD700','#FF6347','#4169E1','#32CD32','#FF69B4','#FFA500']) })
      if (Math.random()>0.3) for (let i=0; i<randInt(1,2); i++)
        addElem(elems, { id: id(), type: 'jellyfish', x: sr(50,310), y: sr(50,120), size: sr(12,18), color: pick(['#DDA0DD','#FF69B4','#87CEEB','#9370DB']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'octopus', x: sr(60,300), y: sr(160,200), size: sr(14,20), color: pick(['#9370DB','#FF69B4','#FF6347']) })
      if (Math.random()>0.4) addElem(elems, { id: id(), type: 'turtle', x: sr(60,300), y: sr(100,160), size: sr(14,20), color: pick(['#2E8B57','#6B8E23']), color2: '#228B22' })
      for (let i=0; i<randInt(2,4); i++)
        addElem(elems, { id: id(), type: 'bubbles', x: sr(30,330), y: sr(30,180), size: sr(8,15), color: '#FFF' }, false)
      for (let i=0; i<randInt(1,3); i++)
        addElem(elems, { id: id(), type: 'shell', x: sr(30,330), y: sr(245,265), size: sr(6,10), color: pick(['#FFB6C1','#DDA0DD','#FFDAB9']) })
      break
    }
  }

  // ── 차이점 생성 ──
  const diffCount = Math.min(3 + Math.floor(round / 3), 5)
  const small: ElemType[] = ['flower','bird','butterfly','bush','cloud','star','shell','crab','fish','bubbles','chicken','mushroom','wave','haystack','comet']
  const noSize: ElemType[] = ['bird','fence','wave','bubbles','streetlamp','trafficLight']
  const candidates = elems.filter(e => {
    if (e.type === 'sun' || e.type === 'moon') return elems.filter(x => x.type === e.type).length > 1
    return true
  })
  const chosen = shuffle(candidates).slice(0, Math.min(diffCount, candidates.length))

  const diffs: Diff[] = chosen.map(elem => {
    const canMissing = small.includes(elem.type)
    const kinds: Diff['kind'][] = ['color']
    if (canMissing) kinds.push('missing')
    if (!noSize.includes(elem.type)) kinds.push('size')
    const kind = pick(kinds)

    const d: Diff = { elemId: elem.id, kind, cx: elem.x, cy: elem.y, r: Math.max(elem.size * 1.2, 20) }

    if (kind === 'color') {
      const pools: Record<string, string[]> = {
        flower: ['#FF6B8A','#FFD700','#FF69B4','#FF4500','#DA70D6','#FFA500'],
        tree: ['#228B22','#2E8B57','#3CB371','#8B4513','#6B8E23'],
        house: ['#FFD700','#FF8C00','#DEB887','#F4A460','#87CEEB'],
        cloud: ['#FFE4E1','#E6E6FA','#FFDAB9'],
        butterfly: ['#FF69B4','#9370DB','#FFD700','#00CED1','#FF6347'],
        building: ['#4A5568','#CBD5E0','#A0AEC0','#2D3748'],
        car: ['#FF4500','#4169E1','#FFD700','#32CD32','#FF69B4','#9370DB'],
        fish: ['#FFD700','#FF6347','#4169E1','#32CD32','#FF69B4','#FFA500'],
        coral: ['#FF6B8A','#FF4500','#FF69B4','#FFA500','#DA70D6'],
        planet: ['#FF6347','#4169E1','#32CD32','#DA70D6','#FF8C00'],
        jellyfish: ['#DDA0DD','#FF69B4','#87CEEB','#9370DB'],
        octopus: ['#9370DB','#FF69B4','#FF6347','#4169E1'],
        barn: ['#B22222','#CD5C5C','#8B0000','#A0522D'],
        chicken: ['#FFF','#F5DEB3','#DEB887','#FFD700'],
        pig: ['#FFB6C1','#FFC0CB','#DDA0DD'],
        seaweed: ['#228B22','#2E8B57','#006400','#3CB371'],
        umbrella: ['#FF4500','#FF69B4','#4169E1','#FFD700','#32CD32'],
        star: ['#FFD700','#FFF','#FFFACD','#ADD8E6','#FF69B4'],
      }
      const pool = pools[elem.type] ?? ['#FF6347','#4169E1','#FFD700','#32CD32','#9370DB']
      let alt = pick(pool); let t=0
      while (alt === elem.color && t < 10) { alt = pick(pool); t++ }
      d.altColor = alt
    } else if (kind === 'size') {
      d.altSize = elem.size * (Math.random() > 0.5 ? 0.5 : 1.5)
    }

    return d
  })

  return { elems, diffs, bgColor, groundColor, theme, groundY }
}

/* ── 장면 SVG 컴포넌트 ── */
function SceneSVG({ level, isRight, found, onTap, showHint, lastFoundId }: {
  level: Level; isRight: boolean; found: Set<string>; onTap?: (id: string) => void
  showHint?: string | null; lastFoundId?: string | null
}) {
  const { elems, diffs, bgColor, groundColor, theme, groundY } = level
  const diffMap = useMemo(() => new Map(diffs.map(d => [d.elemId, d])), [diffs])
  const isUnderwater = theme === 'underwater'

  const handlePointer = useCallback((ev: React.PointerEvent<SVGElement>) => {
    if (!isRight || !onTap) return
    ev.preventDefault()
    const svg = ev.currentTarget; const rect = svg.getBoundingClientRect()
    const cx = (ev.clientX - rect.left) * W / rect.width
    const cy = (ev.clientY - rect.top) * H / rect.height
    for (const d of diffs) {
      if (found.has(d.elemId)) continue
      if (Math.sqrt((cx-d.cx)**2 + (cy-d.cy)**2) < d.r * 2.5) { onTap(d.elemId); return }
    }
    onTap('__miss__')
  }, [isRight, onTap, diffs, found])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl shadow-md border-2 border-white touch-none select-none max-h-[38vh] md:max-h-[70vh]"
    >
      {/* 모든 요소의 포인터 이벤트를 비활성화 */}
      <g pointerEvents="none">
      {/* 배경 */}
      <rect x={0} y={0} width={W} height={H} fill={bgColor}/>
      {/* 바다 테마: 수면 */}
      {theme === 'ocean' && <>
        <rect x={0} y={groundY - 30} width={W} height={30} fill="#4169E1" opacity={0.4}/>
        <rect x={0} y={groundY - 15} width={W} height={15} fill="#4169E1" opacity={0.3}/>
      </>}
      {/* 수중 테마: 물 그라데이션 */}
      {isUnderwater && <defs><linearGradient id={`wg-${isRight?'r':'l'}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#AEE6F7"/><stop offset="100%" stopColor="#0B3D91"/></linearGradient></defs>}
      {isUnderwater && <rect x={0} y={0} width={W} height={H} fill={`url(#wg-${isRight?'r':'l'})`} opacity={0.3}/>}
      {/* 땅/해저 */}
      <ellipse cx={W/2} cy={H+30} rx={W*0.8} ry={H-groundY+40} fill={groundColor}/>
      {/* 도시 도로 줄 */}
      {theme === 'city' && <line x1={0} y1={groundY+35} x2={W} y2={groundY+35} stroke="#FFF" strokeWidth={2} strokeDasharray="12 8" opacity={0.5}/>}

      {elems.map(elem => {
        const diff = isRight ? diffMap.get(elem.id) : undefined
        const isFound = found.has(elem.id)
        let oc: string|undefined, os: number|undefined, hid = false
        if (diff && !isFound) {
          if (diff.kind==='color') oc=diff.altColor
          else if (diff.kind==='missing') hid=true
          else if (diff.kind==='size') os=diff.altSize
        }
        return renderElem(elem, oc, os, hid)
      })}

      {diffs.map(d => found.has(d.elemId) ? (
        <g key={`f-${d.elemId}`}>
          <circle cx={d.cx} cy={d.cy} r={d.r} fill="none" stroke="#22c55e" strokeWidth={3} strokeDasharray="6 3">
            <animate attributeName="r" from={d.r*0.8} to={d.r*1.1} dur="0.6s" repeatCount="1" fill="freeze"/>
          </circle>
          <text x={d.cx} y={d.cy+4} textAnchor="middle" fontSize={14} fill="#22c55e" fontWeight="bold">✓</text>
          {/* 찾은 직후 반짝 효과 */}
          {lastFoundId === d.elemId && isRight && (
            <>
              <circle cx={d.cx} cy={d.cy} r={d.r * 0.5} fill="#22c55e" opacity={0.3}>
                <animate attributeName="r" from={d.r*0.3} to={d.r*2} dur="0.6s" fill="freeze"/>
                <animate attributeName="opacity" from="0.4" to="0" dur="0.6s" fill="freeze"/>
              </circle>
              {[0,60,120,180,240,300].map(a => (
                <circle key={a} cx={d.cx + Math.cos(a*Math.PI/180)*d.r*0.8} cy={d.cy + Math.sin(a*Math.PI/180)*d.r*0.8} r={2} fill="#FFD700">
                  <animate attributeName="r" from="2" to="0" dur="0.8s" fill="freeze"/>
                  <animate attributeName="cx" from={String(d.cx + Math.cos(a*Math.PI/180)*d.r*0.5)} to={String(d.cx + Math.cos(a*Math.PI/180)*d.r*1.5)} dur="0.8s" fill="freeze"/>
                  <animate attributeName="cy" from={String(d.cy + Math.sin(a*Math.PI/180)*d.r*0.5)} to={String(d.cy + Math.sin(a*Math.PI/180)*d.r*1.5)} dur="0.8s" fill="freeze"/>
                </circle>
              ))}
            </>
          )}
        </g>
      ) : null)}

      {/* 힌트 표시: 해당 영역 깜빡 */}
      {showHint && diffs.map(d => d.elemId === showHint ? (
        <circle key={`hint-${d.elemId}`} cx={d.cx} cy={d.cy} r={d.r * 2} fill="#FFD700" opacity={0.15} stroke="#FFD700" strokeWidth={2} strokeDasharray="4 4">
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="0.6s" repeatCount="indefinite"/>
          <animate attributeName="r" values={`${d.r*1.8};${d.r*2.2};${d.r*1.8}`} dur="0.6s" repeatCount="indefinite"/>
        </circle>
      ) : null)}
      </g>
      {/* 투명 오버레이: 모든 터치를 확실하게 캡처 */}
      <rect x={0} y={0} width={W} height={H} fill="transparent" pointerEvents="all" onPointerDown={handlePointer}/>
    </svg>
  )
}

/* ── 메인 컴포넌트 ── */
export default function SpotDiff() {
  useGameTimer()
  const { soundEnabled } = useSettingsStore()
  const [round, setRound] = useState(0)
  const [level, setLevel] = useState(() => generateScene(0))
  const [score, setScore] = useState(0)
  const [found, setFound] = useState<Set<string>>(new Set())
  const [wrongFlash, setWrongFlash] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timeUp, setTimeUp] = useState(false)
  const [combo, setCombo] = useState(0)
  const [hintUsed, setHintUsed] = useState<Set<string>>(new Set())
  const [showHint, setShowHint] = useState<string | null>(null)
  const [lastFoundId, setLastFoundId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const startedRef = useRef(false)

  const totalDiffs = level.diffs.length

  // 타이머 시작
  useEffect(() => {
    if (cleared || timeUp) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setTimeUp(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [round, cleared, timeUp])

  const next = useCallback(() => {
    const nr = round + 1
    setRound(nr)
    setLevel(generateScene(nr))
    setFound(new Set())
    setCleared(false)
    setTimeLeft(60)
    setTimeUp(false)
    setCombo(0)
    setHintUsed(new Set())
    setShowHint(null)
    setLastFoundId(null)
    startedRef.current = false
  }, [round])

  const restart = useCallback(() => {
    setRound(0)
    setLevel(generateScene(0))
    setScore(0)
    setFound(new Set())
    setCleared(false)
    setTimeLeft(60)
    setTimeUp(false)
    setCombo(0)
    setHintUsed(new Set())
    setShowHint(null)
    setLastFoundId(null)
    startedRef.current = false
  }, [])

  // 힌트: 아직 못 찾은 차이 중 하나 주변을 깜빡
  const useHint = useCallback(() => {
    const remaining = level.diffs.filter(d => !found.has(d.elemId) && !hintUsed.has(d.elemId))
    if (remaining.length === 0) return
    const target = remaining[Math.floor(Math.random() * remaining.length)]
    setHintUsed(prev => new Set(prev).add(target.elemId))
    setShowHint(target.elemId)
    setScore(s => Math.max(0, s - 5))
    setTimeout(() => setShowHint(null), 2000)
  }, [level.diffs, found, hintUsed])

  const handleTap = useCallback((elemId: string) => {
    if (cleared || timeUp) return
    if (elemId === '__miss__') {
      if (soundEnabled) playWrong()
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 400)
      setScore(s => Math.max(0, s - 2))
      setCombo(0)
      return
    }
    if (found.has(elemId)) return
    if (soundEnabled) playCorrect()
    const nf = new Set(found); nf.add(elemId); setFound(nf)
    const newCombo = combo + 1
    setCombo(newCombo)
    setLastFoundId(elemId)
    setTimeout(() => setLastFoundId(null), 800)
    // 콤보 보너스: 연속 맞추면 추가 점수
    const comboBonus = Math.min(newCombo - 1, 3) * 5
    setScore(s => s + 10 + comboBonus)
    if (nf.size === totalDiffs) {
      clearInterval(timerRef.current)
      // 시간 보너스: 남은 초 × 2점
      const timeBonus = timeLeft * 2
      setScore(s => s + 20 + timeBonus)
      setCleared(true)
    }
  }, [cleared, timeUp, found, totalDiffs, soundEnabled, combo, timeLeft])

  const remainingHints = level.diffs.filter(d => !found.has(d.elemId) && !hintUsed.has(d.elemId)).length

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-indigo-50 via-violet-50/30 to-slate-50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between mb-1">
        <Link to="/game" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
          <ChevronLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Search size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">틀린그림찾기</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/60">
          <Star size={14} className="text-orange-500" fill="currentColor" />
          <span className="text-sm font-bold text-orange-600">{score}</span>
        </div>
      </header>

      {/* 상태 바: 타이머 + 차이점 + 힌트 */}
      <div className="flex items-center gap-2 mb-2">
        {/* 타이머 */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold ${
          timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'
        }`}>
          ⏱ {timeLeft}초
        </div>

        {/* 차이점 진행 */}
        <div className="flex-1 flex items-center gap-1 justify-center">
          <span className="text-xs text-gray-400">R{round+1}</span>
          <span className="text-xs text-gray-400">{THEME_NAMES[level.theme]}</span>
          {level.diffs.map((d,i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
              found.has(d.elemId) ? 'bg-green-400 border-green-500 scale-110' : 'bg-white border-gray-300'
            }`}/>
          ))}
        </div>

        {/* 콤보 */}
        {combo >= 2 && (
          <span className="text-xs font-bold text-amber-500 animate-bounce">
            🔥×{combo}
          </span>
        )}

        {/* 힌트 버튼 */}
        <button
          onClick={useHint}
          disabled={remainingHints === 0 || cleared || timeUp}
          className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-600 hover:bg-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          💡 힌트 (-5)
        </button>
      </div>

      <main className="flex-1 flex flex-col md:flex-row gap-1.5 items-center justify-center">
        <div className="w-full max-w-md md:max-w-none md:flex-1">
          <p className="text-xs text-center text-gray-400 mb-0.5">▼ 원본</p>
          <SceneSVG level={level} isRight={false} found={found} showHint={showHint}/>
        </div>
        <div className={`w-full max-w-md md:max-w-none md:flex-1 transition-all ${wrongFlash ? 'ring-4 ring-red-400 rounded-2xl animate-[shake_0.3s_ease-in-out]' : ''}`}>
          <p className="text-xs text-center text-gray-400 mb-0.5">▼ 다른 그림을 찾아 터치!</p>
          <SceneSVG level={level} isRight={true} found={found} onTap={handleTap} showHint={showHint} lastFoundId={lastFoundId}/>
        </div>
      </main>

      <AnimatePresence>
        {(cleared || timeUp) && (
          <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl mx-4 border border-gray-100">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${cleared ? 'from-emerald-400 to-green-500' : 'from-rose-400 to-red-500'} flex items-center justify-center shadow-md`}>
                <Trophy size={28} className="text-white" />
              </div>
              <p className={`text-xl font-bold mb-1 ${cleared ? 'text-emerald-600' : 'text-rose-600'}`}>
                {cleared ? '모두 찾았어요!' : '시간 초과!'}
              </p>
              {cleared && (
                <div className="text-sm text-gray-500 mb-1 space-y-0.5">
                  <p>시간 보너스 +{timeLeft * 2}점</p>
                  {combo >= 2 && <p>최고 콤보 ×{combo}</p>}
                </div>
              )}
              <p className="text-gray-500 mb-4">총 {score}점</p>
              <div className="flex gap-3 justify-center">
                {cleared ? (
                  <button onClick={next} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all shadow-md shadow-indigo-500/25">
                    다음 라운드 →
                  </button>
                ) : (
                  <>
                    <button onClick={restart} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
                      처음부터
                    </button>
                    <button onClick={next} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/25">
                      다음 라운드
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
