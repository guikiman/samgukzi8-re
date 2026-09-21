/**
 * 세이브 슬롯 관리자 [17][212]
 *
 * - 수동 슬롯 3개 + 자동 저장 슬롯 1개 (localStorage 기반)
 * - 슬롯마다 메타데이터(저장 시각/연도/월/턴/세력명)를 함께 보관해
 *   이어하기 화면에서 슬롯 정보를 미리 보여줄 수 있다.
 * - 데이터는 LZString 압축 문자열 그대로 저장한다 (용량 보호).
 */
export type SlotId = 1 | 2 | 3 | 'auto';
export interface SaveSlotMeta {
    slot: SlotId;
    savedAt: number;
    year: number;
    month: number;
    turnCount: number;
    factionName: string;
}
export declare class SaveSlotManager {
    /**
     * 슬롯에 세이브 저장
     * @param data LZString 등으로 압축된 세이브 문자열
     */
    save(slot: SlotId, data: string, meta: Omit<SaveSlotMeta, 'slot' | 'savedAt'>): boolean;
    /** 슬롯에서 세이브 복원 — 압축 문자열 반환, 없으면 null */
    load(slot: SlotId): string | null;
    /** 슬롯 메타데이터 조회 (미리보기용) — 없으면 null */
    getMeta(slot: SlotId): SaveSlotMeta | null;
    /** 모든 슬롯 메타데이터 (1, 2, 3, auto 순) */
    getAllMetas(): SaveSlotMeta[];
    /** 슬롯 삭제 */
    delete(slot: SlotId): void;
    /** 저장된 슬롯이 하나라도 있는지 (이어하기 버튼 표시 판정) */
    hasAnySave(): boolean;
}
//# sourceMappingURL=save_slot_manager.d.ts.map