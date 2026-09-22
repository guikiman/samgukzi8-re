/**
 * [Phase 3] 전장 UI 프론트엔드 — BattleFrontend
 *
 * 헥스 전장 렌더링 + 유닛 배치 + 전투 UI 통합.
 * 기존 battle_calculations.ts의 BattleUnit/BattleTile 활용.
 */
import { HexMapCanvasRenderer } from './hex_map_canvas_renderer.js';
import { BattleUnit, BattleTile } from './battle_calculations.js';
export type BattlePhase = 'DEPLOYMENT' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'RESULT';
export type UnitAction = 'MOVE' | 'ATTACK' | 'TACTIC' | 'WAIT';
export interface DeployableUnit {
    unitId: string;
    officerName: string;
    officerId?: string;
    unitType: string;
    soldiers: number;
    morale: number;
    deployed: boolean;
    deployedAt?: {
        q: number;
        r: number;
    };
}
export interface BattleState {
    phase: BattlePhase;
    turn: number;
    currentUnitIndex: number;
    units: BattleUnit[];
    tiles: BattleTile[];
    selectedUnitId: string | null;
    hoveredHex: {
        q: number;
        r: number;
    } | null;
    moveRange: {
        q: number;
        r: number;
    }[];
    attackRange: {
        q: number;
        r: number;
    }[];
    actionLog: string[];
    highlightedPath: {
        q: number;
        r: number;
    }[];
}
export declare class BattleFrontend {
    private renderer;
    private state;
    private deployableUnits;
    private onPhaseChange?;
    private onAction?;
    private readonly UNIT_COLORS;
    constructor(renderer: HexMapCanvasRenderer);
    private createEmptyState;
    initBattle(tiles: BattleTile[], friendlyUnits: DeployableUnit[]): void;
    setCallbacks(cbs: {
        onPhaseChange?: (phase: BattlePhase) => void;
        onAction?: (action: string) => void;
    }): void;
    getDeployableUnits(): DeployableUnit[];
    deployUnit(unitId: string, q: number, r: number): boolean;
    startBattle(): void;
    handleHexClick(q: number, r: number): void;
    handleHexHover(q: number, r: number): void;
    selectUnit(unitId: string): void;
    moveUnit(unitId: string, q: number, r: number): boolean;
    attackUnit(attackerId: string, targetQ: number, targetR: number): void;
    endTurn(): void;
    private resolveEnemyTurn;
    private calcMoveRange;
    private calcAttackRange;
    getState(): BattleState;
    render(ctx: CanvasRenderingContext2D, width: number, height: number): void;
    private renderPhaseOverlay;
}
//# sourceMappingURL=battle_frontend.d.ts.map