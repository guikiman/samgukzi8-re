/**
 * [12] 아이템 제작 및 대장간 — Item Crafter Smith
 *
 * 대장간 무기 강화 시 필요한 소모성 자원 비율과 성공 확률,
 * 특수 옵션(공격력 상승, 특기 부여)의 무작위 난수 매핑 테이블
 */

export interface WeaponBlueprint {
    name: string;
    baseAttack: number;
    materialCost: { gold: number; iron: number };
    specialOptions: string[];
}

export interface CraftResult {
    success: boolean;
    weaponName: string;
    attack: number;
    specialOptions: string[];
    quality: 'NORMAL' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export class ItemCrafterSmith {
    private recipes: Map<string, WeaponBlueprint> = new Map();

    /**
     * 제작 레시피 등록
     */
    registerRecipe(blueprint: WeaponBlueprint): void {
        this.recipes.set(blueprint.name, blueprint);
    }

    getRecipe(name: string): WeaponBlueprint | null {
        return this.recipes.get(name) ?? null;
    }

    getAllRecipes(): WeaponBlueprint[] {
        return Array.from(this.recipes.values());
    }

    /**
     * 무기 제작
     *
     * 성공 확률 = min(90, materialRatio × successModifier)
     * 특수 옵션 부여 확률 = 20%
     */
    craftWeapon(
        recipeName: string,
        availableGold: number,
        availableIron: number,
    ): CraftResult {
        const recipe = this.recipes.get(recipeName);
        if (!recipe) {
            return { success: false, weaponName: recipeName, attack: 0, specialOptions: [], quality: 'NORMAL' };
        }

        // 자원 검증
        if (availableGold < recipe.materialCost.gold || availableIron < recipe.materialCost.iron) {
            return { success: false, weaponName: recipeName, attack: 0, specialOptions: [], quality: 'NORMAL' };
        }

        // 자원 비율 기반 성공 확률
        const goldRatio = availableGold / recipe.materialCost.gold;
        const ironRatio = availableIron / recipe.materialCost.iron;
        const materialRatio = Math.min(goldRatio, ironRatio);
        const successChance = Math.min(90, Math.floor(materialRatio * 60));
        const success = Math.random() * 100 <= successChance;

        if (!success) {
            return { success: false, weaponName: recipeName, attack: 0, specialOptions: [], quality: 'NORMAL' };
        }

        // 품질 결정
        const qualityRoll = Math.random();
        let quality: CraftResult['quality'] = 'NORMAL';
        let attackMultiplier = 1.0;

        if (qualityRoll > 0.99) { quality = 'LEGENDARY'; attackMultiplier = 2.5; }
        else if (qualityRoll > 0.95) { quality = 'EPIC'; attackMultiplier = 2.0; }
        else if (qualityRoll > 0.85) { quality = 'RARE'; attackMultiplier = 1.5; }

        const attack = Math.floor(recipe.baseAttack * attackMultiplier);

        // 특수 옵션 부여 (20% 확률)
        const specialOptions: string[] = [];
        for (const option of recipe.specialOptions) {
            if (Math.random() < 0.2) {
                specialOptions.push(option);
            }
        }

        return { success: true, weaponName: recipeName, attack, specialOptions, quality };
    }

    /**
     * 무기 강화 (기존 무기 + 재료)
     */
    upgradeWeapon(
        currentAttack: number,
        materialGold: number,
    ): { success: boolean; newAttack: number } {
        const upgradeChance = Math.min(80, Math.floor(materialGold / 50));
        const success = Math.random() * 100 <= upgradeChance;
        if (success) {
            const gain = Math.floor(Math.random() * 5) + 1;
            return { success: true, newAttack: currentAttack + gain };
        }
        return { success: false, newAttack: currentAttack };
    }

    reset(): void {
        this.recipes.clear();
    }
}
