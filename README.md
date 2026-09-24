# 삼국지 8 리메이크 (웹)

삼국지조8의 핵심 시스템(평정·내정·외교·전투·인간관계·인생 시뮬레이션)을 웹 기술로 완전 복제하는 프로젝트입니다. 520개 체크리스트 기반으로 구현되었으며, 1,000명 규모 무장 AI를 Web Worker로 처리합니다.

[![CI](https://github.com/guikiman/samgukzi8-re/actions/workflows/ci.yml/badge.svg)](https://github.com/guikiman/samgukzi8-re/actions/workflows/ci.yml)
[![Play](https://img.shields.io/badge/▶_플레이-GitHub_Pages-2ea44f)](https://guikiman.github.io/samgukzi8-re/)

## 🎮 플레이

- **온라인**: GitHub Pages 배포 URL (CI가 main/hippocamp 푸시 시 자동 배포)
- **오프라인**: 첫 접속 후 ServiceWorker가 앱 셸 + dist 전체(500+ 모듈)를 프리캐시 —
  이후 네트워크 없이도 리로드/플레이 가능 [E43]
- **로컬**: `npm run build` 후 프로젝트 루트를 정적 서버로 서빙 (예: `python -m http.server 8000`) → `index.html` 접속

## 🛠️ 개발

```bash
npm install            # 의존성 설치
npm run check          # 타입 체크 (tsc --noEmit)
npm test               # 유닛/통합 테스트 (vitest)
npm run build          # TS 빌드 (dist/) + sw-precache.json 매니페스트 생성
npm run test:e2e       # 빌드 + 브라우저 E2E 스모크 + SW 오프라인 검증 (headless Chrome)
```

### CI 파이프라인
`.github/workflows/ci.yml` — push/PR 시 **타입 체크 → 1,135개 테스트 → 빌드 → E2E** 순차 실행 후, 기본 브랜치 푸시에 한해 GitHub Pages 자동 배포.

## 🏗️ 아키텍처 요약

| 계층 | 구현 |
|---|---|
| 상태 | 정규화된 중앙 스토어 + O(1) 인덱스 (`game_store.ts`) |
| 커맨드 | 커맨드 패턴 + Undo/Redo (`command_system.ts`) |
| FSM | 8페이즈 오케스트레이터 (`game_engine.ts`) |
| AI | Web Worker 1,000명 의사결정 (`ai_worker.ts`) |
| 전투 | 헥사곤 A* + ZOC/보급/기상 (`astar_hex_pathfinder.ts`, `battle_*`) |
| 그래프 | 무장 관계망 (`relationship_graph_evaluator.ts`) |
| 포팅 | Python 30개 모듈 → TS (평정 [76-85], 기후 [321-340], 첩보 [341-360], 인생 [421-438], 메타 [213-214] 등) |
| 연의전 | 6개 시나리오 전체 이벤트 체인 (황건적→출사표) — 시작 연도 실발동 순회 테스트 보장 [300][106-114] |
| PWA | ServiceWorker 프리캐시 + 네비게이션 폴백 (`sw.js`, `sw-precache.json`) [E43] |

## 📜 라이선스

교육/연구 목적의 팬 리메이크 프로젝트입니다.
