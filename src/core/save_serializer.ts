import { GameState, SisyphusGameOrchestrator } from "./sisyphus_orchestrator";
import { GameCalendar } from "./game_calendar";
import { deepClone } from "./state_immutability";
import { ensureSchemaVersion, getSchemaVersion, SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION } from "./state_migration";

export interface SaveHeader {
  readonly version: number;
  readonly timestamp: number;
  readonly turn: number;
  readonly date: string;
  readonly checksum: number;
}

export interface SaveData {
  readonly header: SaveHeader;
  readonly state: unknown;
}

const FNV_OFFSET_BASIS = 0x811C9DC5;
const FNV_PRIME = 0x01000193;

function fnvChecksum(data: string): number {
  let hash = FNV_OFFSET_BASIS;
  const bytes = new TextEncoder().encode(data);
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export class SaveSerializer {
  private readonly version = 1;

  serialize(orchestrator: SisyphusGameOrchestrator): string {
    const state = orchestrator.getState();
    const header: SaveHeader = {
      version: this.version,
      timestamp: Date.now(),
      turn: state.currentTurn,
      date: state.calendar.toString(),
      checksum: 0,
    };
    const clonedState = deepClone(state) as Record<string, unknown>;
    clonedState[SCHEMA_VERSION_KEY] = CURRENT_SCHEMA_VERSION;
    const data: SaveData = { header, state: clonedState };
    const json = JSON.stringify(data);
    const checksum = fnvChecksum(json);
    const finalData: SaveData = {
      header: { ...header, checksum },
      state: clonedState,
    };
    return JSON.stringify(finalData);
  }

  deserialize(data: string): { header: SaveHeader; state: GameState } {
    const parsed: SaveData = JSON.parse(data);
    let rawState = parsed.state as Record<string, unknown>;

    const version = getSchemaVersion(rawState);
    if (version < CURRENT_SCHEMA_VERSION) {
      rawState = ensureSchemaVersion(rawState, parsed.header);
    }

    const calendar = new GameCalendar(
      (rawState.calendar as Record<string, number>).year,
      (rawState.calendar as Record<string, number>).month,
    );

    delete rawState[SCHEMA_VERSION_KEY];
    const state: GameState = {
      ...rawState as unknown as GameState,
      calendar,
    } as GameState;

    return { header: parsed.header, state };
  }

  validateSave(data: string): { valid: boolean; error?: string } {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.header || !parsed.state) {
        return { valid: false, error: "Save data missing header or state" };
      }
      if (typeof parsed.header.version !== "number") {
        return { valid: false, error: "Invalid save version" };
      }
      if (typeof parsed.header.checksum !== "number") {
        return { valid: false, error: "Missing checksum" };
      }

      const storedChecksum = parsed.header.checksum;
      const dataWithoutChecksum = JSON.stringify({
        header: { ...parsed.header, checksum: 0 },
        state: parsed.state,
      });
      const computed = fnvChecksum(dataWithoutChecksum);

      if (storedChecksum !== computed) {
        return { valid: false, error: `Checksum mismatch: stored=${storedChecksum}, computed=${computed}` };
      }

      return { valid: true };
    } catch (e) {
      return { valid: false, error: `Parse failed: ${e}` };
    }
  }
}