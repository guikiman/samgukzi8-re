/**
 * [B10] 계략 함정 배치 매니저 — StratagemTrapDeployer
 *
 * 목적: 아군 지략가가 평정 단계에서 아군 영토 내 특정 타일에
 *       매복 함정을 비공개 배치하는 시스템.
 *
 * 핵심 로직:
 *   1. 좌표 기반 해시 맵에 함정 데이터 적재
 *   2. 플레이어 화면에는 반투명 표시
 *   3. 적 세력 연산 시 타일의 트랩 레이어 완전 블라인드 처리
 */

export type TrapType = 'ROCK' | 'FIRE';
export type TrapVisibility = 'VISIBLE' | 'SEMI_VISIBLE' | 'HIDDEN';

export interface TrapDefinition {
    readonly type: TrapType;
    readonly damage: number;
    readonly authorId: string;
    readonly authorIntel: number;
    readonly placedTurn: number;
    readonly coordKey: string;        // "q,r" 좌표 키
}

export interface TrapState {
    readonly traps: Map<string, TrapDefinition>;
    readonly maxTrapsPerMap: number;
}

export class StratagemTrapDeployer {
    private traps: Map<string, TrapDefinition> = new Map();
    private readonly MAX_TRAPS = 20;

    /**
     * 특정 타일에 함정 배치
     *
     * @param q        - 헥사 큐브 좌표 q
     * @param r        - 헥사 큐브 좌표 r
     * @param type     - 함정 유형
     * @param authorId - 설치 무장 ID
     * @param intel    - 설치 무장 지력 (데미지 보정)
     * @param turn     - 설치 턴
     * @returns 배치 성공 여부
     */
    deployTrap(q: number, r: number, type: TrapType, authorId: string, intel: number, turn: number): boolean {
        if (this.traps.size >= this.MAX_TRAPS) return false;

        const coordKey = `${q},${r}`;
        if (this.traps.has(coordKey)) return false; // 중복 배치 불가

        const damage = type === 'ROCK'
            ? Math.floor(20 + intel * 0.3)
            : Math.floor(15 + intel * 0.2 + 10); // FIRE: 추가 지속 데미지

        this.traps.set(coordKey, {
            type,
            damage,
            authorId,
            authorIntel: intel,
            placedTurn: turn,
            coordKey,
        });

        return true;
    }

    /**
     * 특정 좌표의 함정 조회 (적 세력에게는 HIDDEN)
     *
     * @param coordKey - "q,r" 좌표 키
     * @param isOwner  - 설치자(아군) 여부
     * @returns TrapDefinition | null (적에게는 null 반환 = 블라인드)
     */
    getTrap(coordKey: string, isOwner: boolean): TrapDefinition | null {
        const trap = this.traps.get(coordKey);
        if (!trap) return null;
        if (!isOwner) return null; // 적에게 완전 블라인드
        return trap;
    }

    /** 적에게 보이는 반투명 함정 목록 (탐지 스탯 높을 경우만) */
    getSemiVisibleTraps(intel: number): { coordKey: string; type: TrapType }[] {
        const result: { coordKey: string; type: TrapType }[] = [];
        for (const [key, trap] of this.traps) {
            // 지력이 70 이상이고 설치자 지력보다 20 이상 높으면 반투명 탐지
            if (intel >= 70 && intel - trap.authorIntel >= 20) {
                result.push({ coordKey: key, type: trap.type });
            }
        }
        return result;
    }

    /** 함정 제거 (발동/해체 시) */
    removeTrap(coordKey: string): boolean {
        return this.traps.delete(coordKey);
    }

    /** 모든 함정 정보 반환 (내부 디버깅용) */
    getAllTraps(): TrapDefinition[] {
        return Array.from(this.traps.values());
    }

    /** 맵에 설치된 함정 수 */
    getTrapCount(): number {
        return this.traps.size;
    }
}
