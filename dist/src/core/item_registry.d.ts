/**
 * [A4] 아이템 저장소 및 장비 관리자 — Item Registry & EquipManager
 *
 * ItemRegistry:
 *   1. 명품 아이템 정의 (적토마, 청룡언월도 등)
 *   2. 아이템 고유 스탯 버프 정의
 *   3. 전장 특수 능력 (퇴각 100% 성공 등)
 *
 * EquipManager:
 *   1. 무장에 아이템 장착/해제
 *   2. 장착 중복 체크
 *   3. 아이템 소유권 추적
 */
export type ItemType = 'WEAPON' | 'BOOK' | 'TREASURE' | 'HORSE' | 'TOOL';
export interface ItemEffect {
    readonly might?: number;
    readonly intelligence?: number;
    readonly politics?: number;
    readonly charisma?: number;
    readonly loyalty?: number;
    readonly specialAbility?: string;
    readonly description: string;
}
export interface ItemDefinition {
    readonly id: string;
    readonly name: string;
    readonly type: ItemType;
    readonly rarity: number;
    readonly effects: ItemEffect;
    readonly value: number;
}
export interface EquipSlot {
    readonly itemId: string;
    readonly officerId: string;
    readonly equippedAt: number;
}
export declare class ItemRegistry {
    private items;
    register(item: ItemDefinition): void;
    getItem(id: string): ItemDefinition | null;
    getItemsByType(type: ItemType): ItemDefinition[];
    getAllItems(): ItemDefinition[];
    removeItem(id: string): boolean;
    clear(): void;
    get count(): number;
    registerDefaultItems(): void;
}
export declare class EquipManager {
    private slots;
    private registry;
    constructor(registry: ItemRegistry);
    equip(officerId: string, itemId: string): boolean;
    unequip(itemId: string): boolean;
    unequipAllFromOfficer(officerId: string): void;
    isEquipped(itemId: string): boolean;
    getOfficerEquipment(officerId: string): ItemDefinition[];
    getItemHolder(itemId: string): string | null;
    applyItemEffects(officerId: string, baseStats: {
        might: number;
        intelligence: number;
        politics: number;
        charisma: number;
    }): {
        might: number;
        intelligence: number;
        politics: number;
        charisma: number;
    };
    hasSpecialAbility(officerId: string, ability: string): boolean;
    clear(): void;
}
//# sourceMappingURL=item_registry.d.ts.map