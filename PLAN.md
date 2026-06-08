# 놀공 — 작업 계획서

> 6세 어린이를 위한 종합 학습 PWA  
> 모토: **놀면서 학습할 수 있는 앱**

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 이름 | 놀공 (nolgong) |
| 대상 | 6세 어린이 (미취학~초1) |
| 과목 | 수학 · 영어 · 국어 · 게임 |
| 형태 | PWA (모바일 설치, 오프라인 지원) |
| 배포 | GitHub Pages (GitHub Actions 자동 빌드) |
| 인증 | Google OAuth (Supabase Auth) |
| 동기화 | Supabase (학습 기록 클라우드 동기화) |

---

## 2. 기술 스택

| 레이어 | 선택 | 이유 |
|---|---|---|
| 빌드 | **Vite** | 빠른 HMR, 가벼운 설정 |
| 언어 | **TypeScript** | 모드/문제 데이터 타입 안전 |
| 프레임워크 | **React 18** | 컴포넌트 재사용 (모드/카드/버튼) |
| 라우팅 | **React Router** | 과목 → 모드 → 게임 화면 |
| 스타일 | **Tailwind CSS v4** | 빠른 시안, 6세용 큰 UI 일관성 |
| UI 컴포넌트 | **shadcn/ui** | 모달/버튼/시트 등 세련된 기본기 |
| 애니메이션 | **Framer Motion** | 정답 시 즐거운 피드백 |
| 아이콘 | **lucide-react** + 이모지 | 가벼움 |
| 상태 | **Zustand** | Redux보다 단순 |
| 인증 | **Supabase Auth** | Google OAuth + 세션 관리 |
| DB/동기화 | **Supabase** | 학습 기록 클라우드 동기화 |
| 음성 | **Web Speech API (SpeechSynthesis)** | 외부 의존 X |
| 효과음 | **WebAudio API** | 경량 사운드 |
| 로컬 저장 | **localStorage** | 오프라인 진도 저장 |
| PWA | **수동 SW + manifest** | 세밀한 캐시 제어 |

---

## 3. 디렉토리 구조

```
nolgong/
├── public/
│   ├── 404.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── icons/
│   └── images/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── routes/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── ParentDashboard.tsx
│   │   ├── math/
│   │   │   ├── MathHome.tsx
│   │   │   ├── Addition.tsx
│   │   │   ├── BlankFill.tsx
│   │   │   └── Pattern.tsx
│   │   ├── english/
│   │   │   ├── EnglishHome.tsx
│   │   │   ├── Alphabet.tsx
│   │   │   ├── PictureWord.tsx
│   │   │   ├── ListenWord.tsx
│   │   │   └── Phonics.tsx
│   │   ├── korean/
│   │   │   ├── KoreanHome.tsx
│   │   │   ├── Jamo.tsx
│   │   │   ├── ReadWord.tsx
│   │   │   └── ReadBatchim.tsx
│   │   └── game/
│   │       ├── GameHome.tsx
│   │       ├── WhackAMole.tsx
│   │       ├── DodgePoop.tsx
│   │       ├── SpotDiff.tsx
│   │       ├── MazeFinder.tsx
│   │       ├── Sewing.tsx
│   │       └── BalloonPop.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── game/
│   │   │   ├── GameLayout.tsx
│   │   │   ├── TimerBar.tsx
│   │   │   ├── ScoreBoard.tsx
│   │   │   ├── OptionGrid.tsx
│   │   │   └── Feedback.tsx
│   │   ├── SubjectCard.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── PageTransition.tsx
│   ├── hooks/
│   │   ├── useGameTimer.ts
│   │   ├── useScore.ts
│   │   ├── useSpeech.ts
│   │   ├── useStudyTimer.ts
│   │   └── useTimer.ts
│   ├── lib/
│   │   ├── audio.ts
│   │   ├── random.ts
│   │   ├── storage.ts
│   │   ├── supabase.ts
│   │   ├── sync.ts
│   │   └── utils.ts
│   ├── data/
│   │   ├── alphabet.ts
│   │   ├── dictionary.ts
│   │   ├── englishWords.ts
│   │   ├── koreanBatchimWords.ts
│   │   ├── koreanJamo.ts
│   │   ├── koreanWords.ts
│   │   └── phonics.ts
│   └── stores/
│       ├── authStore.ts
│       ├── progressStore.ts
│       ├── settingsStore.ts
│       ├── statsStore.ts
│       └── studyTimeStore.ts
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 4. 화면 흐름

```
[로그인] → Google OAuth / 게스트 체험
  └─ [홈: 과목 선택]
       ├─ 수학 (Calculator)  → [수학 홈] → 더하기 / 빈칸채우기 / 패턴채우기
       ├─ 영어 (A)           → [영어 홈] → 알파벳 / 파닉스 / 그림단어 / 듣기
       ├─ 한글 (가)          → [국어 홈] → 자음모음 / 단어읽기 / 받침읽기
       ├─ 게임 (Gamepad)     → [게임 홈] → 두더지잡기 / 똥피하기 / 틀린그림 / 미로찾기
       ├─ 부모 대시보드 (BarChart3) — 학습 통계
       └─ 설정 (Settings) — 난이도/소리/타이머
```

---

## 5. 학습 모드 상세

### 수학 (Calculator 아이콘)
1. **더하기** (Plus) — 1자리 덧셈, 6지선다 (난이도 3단계)
2. **빈칸채우기** (PenLine) — 연속 수열 빈칸
3. **패턴채우기** (Shapes) — 등차수열 (5단위 / 임의)

### 영어 (A 아이콘)
4. **알파벳** (ALargeSmall) — 대문자↔소문자 매칭
5. **파닉스** (AudioLines) — 영어 파닉스 학습
6. **그림단어** (Image) — 그림 보고 단어 고르기 4지선다
7. **듣기** (Volume2) — TTS로 단어 듣고 보기 선택

### 한글 (가 아이콘)
8. **자음/모음** (ㄱ SVG) — 자모 인식 + 음가 듣기
9. **단어읽기** (BookOpen) — 그림+글자 매칭 (받침없는 단어)
10. **받침읽기** — 받침 있는 단어 학습

### 게임 (학습 시간 충족 후 잠금 해제)
11. **두더지잡기** (Target) — 반응속도 게임
12. **똥 피하기** (Bomb) — 장애물 회피 게임
13. **틀린그림찾기** (Search) — 관찰력 게임
14. **미로찾기** (Navigation) — 공간지각 게임

---

## 6. 디자인 원칙 (6세 UX)

- **큰 글씨/버튼**: 최소 터치 영역 64×64px
- **밝고 따뜻한 색**: 파스텔 그라디언트 (기존 톤 유지)
- **즉각적 피드백**: 정답 시 색·소리·애니메이션 동시
- **글 의존도 ↓**: 이모지/아이콘 우선, 메뉴 텍스트 최소화
- **좌절감 ↓**: 오답도 격려 톤 ("괜찮아요, 다시!")
- **자동 진행**: 정답 1초 후 다음 문제 (기존 동작 유지)
- **선택적 음성 안내**: 모든 화면 TTS 읽어주기 토글

---

## 7. PWA / 배포

- 수동 Service Worker (`public/sw.js`, network-first 전략)
- 아이콘: 192/512/maskable
- `manifest.webmanifest`: ko, standalone, theme #fff7ed
- 오프라인: 정적 자산 + 단어 데이터 모두 캐시
- GitHub Pages 자동 배포 (GitHub Actions, main → production)
- Supabase 환경변수는 GitHub Secrets로 관리

---

## 8. 완료된 작업

- [x] 환경 셋업 (Vite + React + TS + Tailwind v4 + shadcn/ui)
- [x] 라우팅 + 공통 컴포넌트 (GameLayout/Timer/Score/OptionGrid/Feedback)
- [x] WebAudio 효과음, useTimer, useScore 훅
- [x] 설정 모달
- [x] 수학 3종 (더하기/빈칸/패턴)
- [x] 영어 4종 (알파벳/그림단어/듣기/파닉스)
- [x] 국어 3종 (자모/단어읽기/받침읽기)
- [x] 게임 6종 (두더지/똥피하기/틀린그림/바느질/미로/풍선)
- [x] Google OAuth 로그인 (Supabase)
- [x] 학습 기록 클라우드 동기화
- [x] 부모 대시보드
- [x] 학습 시간 기반 게임 잠금 시스템
- [x] PWA (manifest + SW + 오프라인)
- [x] GitHub Actions 자동 배포

---

## 9. 향후 확장 (백로그)

- 다크모드
- 뺄셈/곱셈
- 영어 문장 학습
- 일일 미션 / 연속 학습 보상
- 접근성 개선 (aria-label, 키보드 포커스)

---

## 10. 개발 환경

```bash
npm install        # 의존성 설치
npm run dev        # 로컬 개발 서버
npm run build      # 프로덕션 빌드
```

`.env` 파일:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
