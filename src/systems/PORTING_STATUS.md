# src/systems — 레거시 Python 모듈 포팅 상태

이 폴더의 Python 파일은 초기 설계 레퍼런스이며, 런타임에는 사용되지 않는다.
게임 런타임은 100% TypeScript (`src/core`, `src/ai`)로 구동된다.

## 포팅 완료 (14건)

| Python 원본 | TS 포팅 |
|---|---|
| `battle_engine.py` | `src/core/auto_battle_simulator.ts` |
| `city_manager.py` | `src/core/city_grade_manager.ts`, `land_development_engine.ts` 등 |
| `diplomacy_manager.py` | `src/core/diplomacy_engine.ts` |
| `event_engine.py` | `src/core/event_chain_engine.ts` |
| `intelligence_manager.py` | `src/core/intelligence_narrative_climate.ts` |
| `life_simulator.py` | `src/core/life_simulator.ts` |
| `meta_manager.py` | `src/core/meta_systems.ts` |
| `replay_manager.py` | `src/core/replay_share_manager.ts` |
| `save_manager.py` | `src/core/save_serializer.ts`, `chunked_save_pipeline.ts` |
| `scenario_branch_manager.py` | `src/core/scenario_branch_manager.ts` |
| `social_interaction.py` | `src/core/officer_interaction_system.ts` |
| `strategic_manager.py` | `src/core/strategic_command_system.ts` |
| `ai_strategy_manager.py` | `src/ai/ai_worker_simulator.ts` (2026-09 포팅) |
| `graph_db.py` | `src/core/relationship_graph_db.ts` (2026-09 포팅) |

## 이번 세션 신규 포팅 (2026-09-24)

- `ai_strategy_manager.py` → `src/ai/ai_worker_simulator.ts`: 1,000명 무장 가중치 AI
  (야망/충성도/군주 성향 × 도시 자원), 세력 단위 스트리밍 배치. AGENTS.md §7 요구사항.
- `graph_db.py` → `src/core/relationship_graph_db.ts`: O(1) 해시맵 관계망 DB,
  75% 인맥 필터링(80명 한계), Ripple Effect(2도 BFS 절반 감쇠 전파).
- `pathfinding.py` → `src/core/hex_battle_rules_engine.ts`: 병종/지형 MP 비용,
  ZOC 강제정지 A*, BFS 보급선 검사. 기존 `astar_hex_pathfinder.ts`(범용)와 상호보완.

## 보존 판정 (포팅하지 않음)

나머지 파일들(`climate_manager.py`, `psychology_manager.py`, `battle_physics.py`,
`warlords.py`, `economy_manager.py`, `family_manager.py` 등 20~60줄 스텁)은
다음 TS 시스템으로 기능이 이미 대체되어 포팅 가치가 없다:

- 기후 → `dynamic_weather_engine.ts`, `climate_renderer_sync.ts`
- 심리 → `officer_psychology_engine.ts`, `desire_vector_model.ts`
- 전장 물리 → `fire_spread_simulator.ts`, `cavalry_charge_physics.ts`, `siege_physics_calculations.ts`
- 무장 데이터 → `officer_factory.ts`, `officer_schema.ts`, `src/data/officers.json`
- 경제 → `market_engine.ts`, `city_economy_simulator.ts`, `fiscal_scheduler.ts`

레거시 참조로 보존하되, 신규 기능은 `src/core`에 TS로만 구현한다.
