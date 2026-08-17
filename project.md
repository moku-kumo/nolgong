# 놀공 프로젝트 가이드

## 프로젝트 개요

6세 어린이를 위한 종합 학습 PWA. **React 19 + TypeScript + Vite + Tailwind CSS 4** 기반.
배포: https://moku-kumo.github.io/nolgong/

### 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 | Vite 8 |
| 스타일 | Tailwind CSS 4 (shadcn/ui) |
| 라우팅 | react-router-dom 7 |
| 상태 관리 | Zustand 5 |
| 애니메이션 | Framer Motion 12 |
| 아이콘 | Lucide React |
| 백엔드 | Supabase (인증 + 동기화) |
| PWA | Service Worker + manifest |

---

## 디렉터리 구조

```
src/
├── App.tsx              # 전체 라우트 정의
├── main.tsx             # 엔트리포인트
├── index.css            # Tailwind 설정 + 테마
├── components/          # 공용 UI 컴포넌트
│   ├── game/            # 게임 공통 레이아웃 (GameLayout, OptionGrid, Feedback 등)
│   └── ui/              # shadcn 기반 UI (button 등)
├── data/                # 정적 학습 데이터
│   ├── alphabet.ts      # 영어 대소문자 배열
│   ├── englishWords.ts  # 영어 단어 + 이모지 + 한국어 뜻
│   ├── englishStrokes.ts # 영어 알파벳 획순 (다점 경로)
│   ├── koreanJamo.ts    # 한글 자모 + 이름
│   ├── koreanStrokes.ts # 한글 자모 획순 (다점 경로)
│   ├── numberStrokes.ts # 숫자 0~9 획순 (다점 경로)
│   ├── koreanWords.ts   # 한글 단어 데이터
│   ├── koreanBatchimWords.ts
│   ├── dictionary.ts
│   ├── phonics.ts
│   └── stories.ts
├── hooks/               # 커스텀 훅
│   ├── useScore.ts      # 점수 관리 + 로컬 저장
│   ├── useSpeech.ts     # TTS 음성 재생
│   ├── useGameTimer.ts
│   ├── useStudyTimer.ts
│   └── useTimer.ts
├── lib/                 # 유틸리티
│   ├── audio.ts         # 효과음 (정답/오답)
│   ├── random.ts        # 랜덤 + 셔플
│   ├── storage.ts       # localStorage 래퍼
│   ├── supabase.ts      # Supabase 클라이언트
│   ├── sync.ts          # 서버 동기화
│   └── utils.ts         # cn() 등
├── routes/              # 페이지 컴포넌트
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── ParentDashboard.tsx
│   ├── korean/          # 한국어 학습
│   │   ├── KoreanHome.tsx
│   │   ├── Jamo.tsx
│   │   ├── ReadWord.tsx
│   │   ├── ReadBatchim.tsx
│   │   ├── Writing.tsx      # 자모 + 단어 쓰기
│   │   ├── StoryHome.tsx
│   │   └── StoryRead.tsx
│   ├── english/         # 영어 학습
│   │   ├── EnglishHome.tsx
│   │   ├── Alphabet.tsx
│   │   ├── Phonics.tsx
│   │   ├── PictureWord.tsx
│   │   ├── ListenWord.tsx
│   │   └── Writing.tsx      # 대소문자 + 첫 글자 쓰기
│   ├── math/            # 수학 학습
│   │   ├── MathHome.tsx
│   │   ├── Addition.tsx
│   │   ├── Subtraction.tsx
│   │   ├── Multiplication.tsx
│   │   ├── BlankFill.tsx
│   │   ├── Pattern.tsx
│   │   ├── ClockReading.tsx
│   │   └── NumberWriting.tsx # 숫자 쓰기 (0~9 / 1~100)
│   └── game/            # 보상 게임
│       ├── GameHome.tsx
│       ├── WhackAMole.tsx
│       ├── DodgePoop.tsx
│       ├── SpotDiff.tsx
│       ├── MazeFinder.tsx
│       ├── Sewing.tsx
│       ├── MemoryMatch.tsx
│       ├── Snake.tsx
│       └── BalloonPop.tsx
└── stores/              # Zustand 스토어
    ├── authStore.ts     # 인증 상태
    ├── settingsStore.ts # 설정 (타이머, 소리, 난이도)
    ├── progressStore.ts
    ├── recordsStore.ts
    ├── statsStore.ts
    └── studyTimeStore.ts
```

---

## 글씨 쓰기 시스템 (핵심 구현 패턴)

### 획순 데이터 형식

모든 획순 데이터는 동일한 형식을 사용:

```typescript
type Stroke = [number, number][]  // [x, y] 좌표 배열, 0~1 정규화
// 직선: 2점, 곡선: 다점 경로 (ㅇ, O, S 등)
```

- `koreanStrokes.ts` — 한글 자음/모음 14+10자
- `englishStrokes.ts` — 영어 대/소문자 52자
- `numberStrokes.ts` — 숫자 0~9

### 가이드 렌더링 패턴

1. **글자 외곽**: 점선 + 연한 채우기 (민트/파란/보라 계열)
2. **획순 경로**: 핑크 점선 (`#ec4899`, alpha 0.35)
3. **시작 번호**: 핑크 원 + 흰 텍스트 (겹침 방지 알고리즘으로 자동 배치)
4. **방향 화살표**: 핑크 삼각형 (alpha 0.4)
5. **번호 연결선**: 핑크 실선 (alpha 0.3)

투명도는 한글/영어/숫자 모두 동일한 값을 사용.

### 캔버스 크기

| 용도 | 크기 (px) |
|------|-----------|
| 자모/대소문자/숫자 메인 | 340 × 340 |
| 한글 단어 음절별 | 140 × 140 |
| 숫자 1~100 자릿수별 | 140 × 140 |
| 영어 첫 글자 인라인 | 128 × 144 |

### 그리기 색상

- 펜 색상: 보라 `#7c3aed` (항상 고정)
- 펜 두께: 메인 캔버스 11px, 작은 캔버스 7~10px

---

## 학습 모드 상세

### 한글 글씨 쓰기 (`/korean/writing`)
- **자음/모음 탭**: 큰 캔버스 + 획순 가이드 + 따라쓰기/자유쓰기 모드 + 자동 채점
- **단어 탭**: 이모지 + 단어 표시 → 음절별 독립 캔버스로 따라쓰기 (1~2글자)

### 영어 글씨 쓰기 (`/english/writing`)
- **대/소문자 탭**: A→a→B→b 순서, 큰 캔버스 + 획순 가이드
- **첫 글자 탭**: 🍎 [C 쓰기칸]at 고양이 형태의 인라인 캔버스

### 숫자 쓰기 (`/math/number-writing`)
- **0~9 탭**: 큰 캔버스 + 획순 가이드
- **1~100 탭**: 숫자 표시 → 자릿수별 독립 캔버스 (1자리=1칸, 2자리=2칸, 100=3칸)

---

## 작업 시 유의사항

### 빌드 & 검증
- `npm run build` = `tsc -b && vite build`
- 새 파일 추가 후 Vite HMR이 깨지면 개발 서버 재시작 필요
- 파일 삭제→재생성 시 Vite 캐시가 이전 export를 참조하므로 서버 재시작 권장

### Tailwind CSS 주의
- Tailwind v4 (CSS-first config) 사용 — `tailwind.config.js` 없음
- 새 색상 유틸리티가 빌드에 포함되지 않을 수 있음 → 기존 코드에서 사용된 클래스 확인
- 예: `bg-emerald-600`이 생성되지 않으면 `bg-green-500`처럼 이미 사용 중인 클래스로 대체

### 캔버스 관련
- 모바일 터치 지원: `pointerDown/Move/Up` + `setPointerCapture` 사용
- 멀티 캔버스 시 각각 독립 컴포넌트로 분리 (ref 관리)
- `willReadFrequently` 경고는 무시 가능 (성능 영향 미미)

### 라우팅
- 모든 라우트는 `ProtectedRoute`로 감싸져 있음
- 체험 모드에서는 localStorage 기반 임시 인증
- `BrowserRouter`의 `basename="/nolgong"` 사용

### 상태 관리
- 설정은 `settingsStore` (Zustand + localStorage persist)
- 점수는 `useScore` 훅 (과목별 키로 localStorage 저장)
- 학습 시간은 `studyTimeStore` (5분 달성 시 게임 잠금 해제)

### 데이터 추가 시
- 한글 단어: `wordListWithEmoji` 배열에 `{ word, emoji }` 추가
- 영어 단어: `englishWords.ts`에 `{ en, ko, emoji }` 추가
- 획순: 각 `*Strokes.ts`에 `[x,y][]` 배열 추가 (0~1 정규화, 곡선은 다점)

### 디자인 일관성
- 과목별 테마 색상: 수학=파랑, 영어=초록, 한국어=보라
- 획순 가이드: 모든 과목에서 핑크 (#ec4899) 통일
- 투명도: 점선 0.35, 화살표 0.4, 연결선 0.3, 번호원 0.5
- 간격: 모바일 최적화 (max-w-lg, px-5)

---

## 배포

```bash
npm run build        # dist/ 생성
# GitHub Pages로 배포 (gh-pages 브랜치)
```

PWA 지원: `public/manifest.webmanifest` + `public/sw.js`
