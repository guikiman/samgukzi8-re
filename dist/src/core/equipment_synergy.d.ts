/**
 * [12] 무장 소지 보주/장비의 '특수 효과 시너지 매트릭스'
 *
 * EquipmentSynergyMatrix:
 *   - 명마 장착 → 기병 기동력 증가
 *   - 보물 도서 소지 → 책략 범위 +1칸
 *   - 명검 장착 → 일기토 대미지 +20%
 *   - 갑옷 장착 → 방어력 +15%
 *   - 장비 종류와 무장 특기가 직접 결합되는 정밀 물리 매트릭스
 */
export type EquipmentType = 'horse' | 'sword' | 'book' | 'armor' | 'bow' | 'treasure';
export interface Equipment {
    readonly id: string;
    readonly name: string;
    readonly type: EquipmentType;
    readonly effects: readonly EquipmentEffect[];
}
export interface EquipmentEffect {
    readonly stat: string;
    readonly value: number;
    readonly description: string;
}
export interface SynergyResult {
    readonly equipmentName: string;
    readonly officerTrait: string;
    readonly combinedEffect: string;
    readonly statBonus: number;
}
export declare class EquipmentSynergyMatrix {
    /**
     * [12] 장비-특기 시너지 매트릭스
     *
     * 명마(horse) + 기병 특기 → 기동력 +2
     * 보물 도서(book) + 책략 특기 → 책략 범위 +1
     * 명검(sword) + 무력 특기 → 일기토 대미지 +20%
     * 갑옷(armor) + 방어 특기 → 방어력 +15%
     * 활(bow) + 궁병 특기 → 사거리 +1
     * 보물(treasure) + 외교 특기 → 외교 성공률 +10%
     */
    computeSynergy(equipmentType: string, officerTraits: string[]): SynergyResult | null;
}
//# sourceMappingURL=equipment_synergy.d.ts.map