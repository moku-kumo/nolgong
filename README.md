# 🎓 놀공

> 6세 어린이를 위한 종합 학습 PWA — **놀면서 배우자!**

## 📱 배포

**[https://moku-kumo.github.io/nolgong/](https://moku-kumo.github.io/nolgong/)**

모바일 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.

## 📚 과목 & 학습 모드

| 과목 | 모드 | 설명 |
|------|------|------|
| 🔢 수학 | ➕ 더하기 | 1자리 덧셈, 6지선다 (난이도 3단계) |
| | ✖️ 곱하기 | 구구단 연습 (난이도 3단계) |
| | ⬜ 빈칸채우기 | 연속 수열 빈칸 맞히기 |
| | 🧩 패턴채우기 | 등차수열 패턴 찾기 |
| | 🕐 시계읽기 | 아날로그 시계 보고 시간 맞추기 (난이도 3단계) |
| 🔤 영어 | 🅰️ 알파벳 | 대문자↔소문자 매칭 |
| | 🖼️ 그림단어 | 이모지 그림 보고 영어 단어 고르기 |
| | 🔊 듣기 | TTS로 단어 듣고 고르기 |
| | 📖 파닉스 | 영어 파닉스 학습 |
| 가 국어 | ㄱㅏ 자음/모음 | 자모 인식 + 음가 듣기 |
| | 📖 단어읽기 | 그림+한글 매칭 (받침없는 단어) |
| | 📖 받침읽기 | 받침 있는 단어 학습 |
| 🎮 게임 | 🔨 두더지잡기 | 두더지 잡기 미니게임 |
| | 💩 피하기 | 똥 피하기 게임 |
| | 🔍 틀린그림 | 틀린 그림 찾기 |
| | 🧵 바느질 | 바느질 게임 |
| | 🏃 미로탈출 | 미로 찾기 게임 |
| | 🃏 기억력 | 카드 뒤집기 매칭 (동물/국기/음식 테마) |

## 🔐 인증 & 동기화

- Google OAuth 로그인 (Supabase Auth)
- 로그인 시 학습 기록 클라우드 동기화
- 게스트 모드 지원 (로컬 저장)
- SNS 공유 (Web Share API / 클립보드 복사)

## 👨‍👩‍👧 부모 대시보드

- PIN 인증 후 접근
- 학습 시간 통계
- 과목별 진도 확인
- 게임 해금 시간 설정 (학습 후 게임 잠금 해제)
- PIN 변경 / 로그아웃

## 🛠️ 기술 스택

Vite · React 18 · TypeScript · Tailwind CSS v4 · shadcn/ui · Zustand · Framer Motion · Supabase · Web Speech API · WebAudio API

## 🚀 개발

```bash
npm install
npm run dev
```

`.env` 파일에 Supabase 환경변수 설정 필요:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📦 배포

`main` 브랜치에 push하면 GitHub Actions를 통해 GitHub Pages에 자동 배포됩니다.

## 📄 라이선스

MIT
