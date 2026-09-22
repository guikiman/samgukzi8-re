/**
 * 로밍 이벤트 대화 시스템 [25][441-460][461-480]
 *
 * 로밍 이벤트(roaming_event_system)가 플레이어 도시에 발생하면 자동 적용 대신
 * 선택지 대화를 제공한다. 각 방문자 유형별로 2~3개의 응대 옵션이 있으며,
 * 선택에 따라 자원/명성/치안 효과가 달라진다.
 *
 * - getRoamingDialogue: 방문자 유형별 대화 씬 + 옵션 목록 (UI 렌더용)
 * - resolveRoamingDialogue: 선택 적용 — 순수 계산 후 스토어에 반영
 *   (산적 진압처럼 확률 판정이 필요한 경우 roll을 주입해 결정적 테스트 지원)
 */
import type { GameStore } from './game_store.js';
/** 대화 선택지 */
export interface RoamingDialogueOption {
    id: string;
    label: string;
    description: string;
}
/** 대화 씬 데이터 (UI 렌더용) */
export interface RoamingDialogueData {
    visitorType: string;
    title: string;
    description: string;
    options: RoamingDialogueOption[];
}
/** 선택 결과 */
export interface RoamingDialogueResolution {
    /** 게임 로그용 메시지 */
    message: string;
    /** 적용된 효과 요약 (상세 로그용) */
    effects: string[];
}
/** 산적 — 진압 성공 확률 */
export declare const BANDIT_SUPPRESS_CHANCE = 0.5;
/** 방문자 유형별 대화 씬 생성 */
export declare function getRoamingDialogue(visitorType: string, cityName: string, factionName: string | null): RoamingDialogueData;
/** 방문자 유형별 아이콘 (방문 알림 로그용) */
export declare function roamingVisitorIcon(visitorType: string): string;
/**
 * 선택지를 스토어에 적용한다. 플레이어 대화 모달에서 호출.
 * @param roll 산적 진압 등 확률 판정용 난수 (미지정 시 Math.random)
 */
export declare function resolveRoamingDialogue(store: GameStore, visitorType: string, cityId: string, optionId: string, roll?: number): RoamingDialogueResolution;
//# sourceMappingURL=roaming_dialogue_system.d.ts.map