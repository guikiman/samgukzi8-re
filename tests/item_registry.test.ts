import { describe, it, expect, beforeEach } from 'vitest';
import { ItemRegistry, EquipManager } from '../src/core/item_registry';

describe('ItemRegistry', () => {
    let registry: ItemRegistry;

    beforeEach(() => {
        registry = new ItemRegistry();
    });

    it('should register and get item', () => {
        registry.register({ id: 'test_item', name: '테스트', type: 'WEAPON', rarity: 1, effects: { might: 5, description: '테스트' }, value: 100 });
        const item = registry.getItem('test_item');
        expect(item).not.toBeNull();
        expect(item!.name).toBe('테스트');
    });

    it('should return null for unknown item', () => {
        expect(registry.getItem('nonexistent')).toBeNull();
    });

    it('should get items by type', () => {
        registry.register({ id: 'sword', name: '검', type: 'WEAPON', rarity: 1, effects: { might: 3, description: '검' }, value: 100 });
        registry.register({ id: 'book', name: '책', type: 'BOOK', rarity: 2, effects: { intelligence: 3, description: '책' }, value: 100 });
        expect(registry.getItemsByType('WEAPON').length).toBe(1);
        expect(registry.getItemsByType('BOOK').length).toBe(1);
    });

    it('should register default items', () => {
        registry.registerDefaultItems();
        expect(registry.count).toBe(8);
    });

    it('should remove item', () => {
        registry.register({ id: 'test', name: '테스트', type: 'TOOL', rarity: 1, effects: { description: '테스트' }, value: 10 });
        expect(registry.removeItem('test')).toBe(true);
        expect(registry.count).toBe(0);
    });

    it('should clear all', () => {
        registry.register({ id: 'test', name: '테스트', type: 'TOOL', rarity: 1, effects: { description: '테스트' }, value: 10 });
        registry.clear();
        expect(registry.count).toBe(0);
    });
});

describe('EquipManager', () => {
    let registry: ItemRegistry;
    let equip: EquipManager;

    beforeEach(() => {
        registry = new ItemRegistry();
        registry.registerDefaultItems();
        equip = new EquipManager(registry);
    });

    it('should equip item', () => {
        expect(equip.equip('off_guan', 'green_dragon')).toBe(true);
    });

    it('should not equip already equipped item', () => {
        equip.equip('off_guan', 'green_dragon');
        expect(equip.equip('off_zhang', 'green_dragon')).toBe(false);
    });

    it('should not equip unknown item', () => {
        expect(equip.equip('off_guan', 'nonexistent')).toBe(false);
    });

    it('should unequip item', () => {
        equip.equip('off_guan', 'green_dragon');
        expect(equip.unequip('green_dragon')).toBe(true);
    });

    it('should get officer equipment', () => {
        equip.equip('off_guan', 'green_dragon');
        equip.equip('off_guan', 'red_hare');
        expect(equip.getOfficerEquipment('off_guan').length).toBe(2);
    });

    it('should check if item is equipped', () => {
        equip.equip('off_guan', 'green_dragon');
        expect(equip.isEquipped('green_dragon')).toBe(true);
    });

    it('should apply item effects', () => {
        equip.equip('off_guan', 'green_dragon');
        const stats = equip.applyItemEffects('off_guan', { might: 97, intelligence: 75, politics: 40, charisma: 80 });
        expect(stats.might).toBe(105);
    });

    it('should detect special ability', () => {
        equip.equip('off_guan', 'red_hare');
        expect(equip.hasSpecialAbility('off_guan', 'RETREAT_ALWAYS_SUCCESS')).toBe(true);
    });

    it('should get item holder', () => {
        equip.equip('off_guan', 'green_dragon');
        expect(equip.getItemHolder('green_dragon')).toBe('off_guan');
    });

    it('should unequip all from officer', () => {
        equip.equip('off_guan', 'green_dragon');
        equip.equip('off_guan', 'red_hare');
        equip.unequipAllFromOfficer('off_guan');
        expect(equip.getOfficerEquipment('off_guan').length).toBe(0);
    });

    it('should clear all', () => {
        equip.equip('off_guan', 'green_dragon');
        equip.clear();
        expect(equip.getOfficerEquipment('off_guan').length).toBe(0);
    });
});
