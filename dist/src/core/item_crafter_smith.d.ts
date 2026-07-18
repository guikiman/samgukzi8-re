/**
 * [12] 아이템 제작 및 대장간 — Item Crafter Smith
 *
 * 대장간 무기 강화 시 필요한 소모성 자원 비율과 성공 확률,
 * 특수 옵션(공격력 상승, 특기 부여)의 무작위 난수 매핑 테이블
 */
export interface WeaponBlueprint {
    name: string;
    baseAttack: number;
    materialCost: {
        gold: number;
        iron: number;
    };
    specialOptions: string[];
}
export interface CraftResult {
    success: boolean;
    weaponName: string;
    attack: number;
    specialOptions: string[];
    quality: 'NORMAL' | 'RARE' | 'EPIC' | 'LEGENDARY';
}
export declare class ItemCrafterSmith {
    private recipes;
    /**
     * 제작 레시피 등록
     */
    registerRecipe(blueprint: WeaponBlueprint): void;
    getRecipe(name: string): WeaponBlueprint | null;
    getAllRecipes(): WeaponBlueprint[];
    /**
     * 무기 제작
     *
     * 성공 확률 = min(90, materialRatio × successModifier)
     * 특수 옵션 부여 확률 = 20%
     */
    craftWeapon(recipeName: string, availableGold: number, availableIron: number): CraftResult;
    /**
     * 무기 강화 (기존 무기 + 재료)
     */
    upgradeWeapon(currentAttack: number, materialGold: number): {
        success: boolean;
        newAttack: number;
    };
    reset(): void;
}
//# sourceMappingURL=item_crafter_smith.d.ts.map