/**
 * [Task 31] RENDER_QUEUE_PUSH 이벤트 프레임 레이아웃 규격화
 *
 * WebGL이 읽고 해석할 연출 명령 오브젝트 모델의
 * 완전한 타입 안전성 보장.
 */

export type RenderCommandType =
  | "TILE_CHANGE"
  | "UNIT_MOVE"
  | "UNIT_ATTACK"
  | "TACTIC_FX"
  | "FLOATING_TEXT"
  | "CAMERA_FOCUS"
  | "SOUND_PLAY"
  | "UI_OVERLAY"
  | "BATTLE_REPORT"
  | "FLUSH";

export interface HexCoord {
  readonly q: number;
  readonly r: number;
}

export interface TileChangePayload {
  readonly coord: HexCoord;
  readonly newTerrain: string;
  readonly fx?: string;
}

export interface UnitMovePayload {
  readonly unitId: string;
  readonly path: HexCoord[];
  readonly speed: number;
}

export interface TacticFxPayload {
  readonly name: string;
  readonly origin: HexCoord;
  readonly target: HexCoord;
  readonly duration: number;
}

export interface FloatingTextPayload {
  readonly text: string;
  readonly coord: HexCoord;
  readonly color: string;
  readonly duration: number;
}

export interface CameraFocusPayload {
  readonly coord: HexCoord;
  readonly zoom: number;
  readonly instant: boolean;
}

export interface SoundPayload {
  readonly soundId: string;
  readonly volume: number;
  readonly loop: boolean;
}

export interface UiOverlayPayload {
  readonly type: string;
  readonly data: unknown;
}

export interface BattleReportPayload {
  readonly attackerId: string;
  readonly defenderId: string;
  readonly damage: number;
  readonly moraleLoss: number;
  readonly casualties: { dead: number; wounded: number; deserted: number };
}

export interface RenderCommandPayload {
  readonly TILE_CHANGE: TileChangePayload;
  readonly UNIT_MOVE: UnitMovePayload;
  readonly UNIT_ATTACK: UnitMovePayload;
  readonly TACTIC_FX: TacticFxPayload;
  readonly FLOATING_TEXT: FloatingTextPayload;
  readonly CAMERA_FOCUS: CameraFocusPayload;
  readonly SOUND_PLAY: SoundPayload;
  readonly UI_OVERLAY: UiOverlayPayload;
  readonly BATTLE_REPORT: BattleReportPayload;
  readonly FLUSH: undefined;
}

export interface TypedRenderCommand<T extends RenderCommandType> {
  readonly type: T;
  readonly payload: RenderCommandPayload[T];
  readonly timestamp: number;
}

export type AnyRenderCommand = TypedRenderCommand<RenderCommandType>;
