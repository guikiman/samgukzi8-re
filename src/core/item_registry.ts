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

export class ItemRegistry {
    private items: Map<string, ItemDefinition> = new Map();

    register(item: ItemDefinition): void {
        this.items.set(item.id, { ...item });
    }

    getItem(id: string): ItemDefinition | null {
        return this.items.get(id) ?? null;
    }

    getItemsByType(type: ItemType): ItemDefinition[] {
        return Array.from(this.items.values()).filter(i => i.type === type);
    }

    getAllItems(): ItemDefinition[] {
        return Array.from(this.items.values());
    }

    removeItem(id: string): boolean {
        return this.items.delete(id);
    }

    clear(): void {
        this.items.clear();
    }

    get count(): number { return this.items.size; }

    registerDefaultItems(): void {
        this.register({ id: 'green_dragon', name: '청룡언월도', type: 'WEAPON', rarity: 5, effects: { might: 8, description: '무력 +8, 관우 전용' }, value: 1000 });
        this.register({ id: 'red_hare', name: '적토마', type: 'HORSE', rarity: 5, effects: { specialAbility: 'RETREAT_ALWAYS_SUCCESS', description: '퇴각 100% 성공' }, value: 800 });
        this.register({ id: 'hex_mark', name: '육도', type: 'BOOK', rarity: 4, effects: { intelligence: 5, description: '지력 +5' }, value: 600 });
        this.register({ id: 'art_of_war', name: '손자병법', type: 'BOOK', rarity: 4, effects: { intelligence: 5, politics: 3, description: '지력 +5, 정치 +3' }, value: 600 });
        this.register({ id: 'heavenly_sword', name: '천지검', type: 'WEAPON', rarity: 4, effects: { might: 5, description: '무력 +5' }, value: 700 });
        this.register({ id: 'lion_bow', name: '양자노', type: 'WEAPON', rarity: 3, effects: { might: 3, description: '무력 +3' }, value: 400 });
        this.register({ id: 'jade_seal', name: '옥새', type: 'TREASURE', rarity: 5, effects: { charisma: 10, loyalty: 10, description: '매력 +10, 충성도 +10' }, value: 2000 });
        this.register({ id: 'silver_armor', name: '은갑옷', type: 'TOOL', rarity: 3, effects: { description: '방어력 소폭 상승' }, value: 300 });
    }
}

export class EquipManager {
    private slots: Map<string, EquipSlot> = new Map();
    private registry: ItemRegistry;

    constructor(registry: ItemRegistry) {
        this.registry = registry;
    }

    equip(officerId: string, itemId: string): boolean {
        const item = this.registry.getItem(itemId);
        if (!item) return false;
        if (this.isEquipped(itemId)) return false;
        this.slots.set(itemId, { itemId, officerId, equippedAt: Date.now() });
        return true;
    }

    unequip(itemId: string): boolean {
        return this.slots.delete(itemId);
    }

    unequipAllFromOfficer(officerId: string): void {
        for (const [itemId, slot] of this.slots) {
            if (slot.officerId === officerId) {
                this.slots.delete(itemId);
            }
        }
    }

    isEquipped(itemId: string): boolean {
        return this.slots.has(itemId);
    }

    getOfficerEquipment(officerId: string): ItemDefinition[] {
        return Array.from(this.slots.values())
            .filter(s => s.officerId === officerId)
            .map(s => this.registry.getItem(s.itemId)!)
            .filter(Boolean);
    }

    getItemHolder(itemId: string): string | null {
        const slot = this.slots.get(itemId);
        return slot?.officerId ?? null;
    }

    applyItemEffects(officerId: string, baseStats: { might: number; intelligence: number; politics: number; charisma: number }): { might: number; intelligence: number; politics: number; charisma: number } {
        const stats = { ...baseStats };
        const equipment = this.getOfficerEquipment(officerId);
        for (const item of equipment) {
            if (item.effects.might) stats.might += item.effects.might;
            if (item.effects.intelligence) stats.intelligence += item.effects.intelligence;
            if (item.effects.politics) stats.politics += item.effects.politics;
            if (item.effects.charisma) stats.charisma += item.effects.charisma;
        }
        return stats;
    }

    hasSpecialAbility(officerId: string, ability: string): boolean {
        const equipment = this.getOfficerEquipment(officerId);
        return equipment.some(item => item.effects.specialAbility === ability);
    }

    clear(): void {
        this.slots.clear();
    }
}
