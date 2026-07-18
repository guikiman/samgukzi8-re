import { GameCalendar } from "./game_calendar";
import { deepClone } from "./state_immutability";
import { ensureSchemaVersion, getSchemaVersion, SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION } from "./state_migration";
const FNV_OFFSET_BASIS = 0x811C9DC5;
const FNV_PRIME = 0x01000193;
function fnvChecksum(data) {
    let hash = FNV_OFFSET_BASIS;
    const bytes = new TextEncoder().encode(data);
    for (let i = 0; i < bytes.length; i++) {
        hash ^= bytes[i];
        hash = Math.imul(hash, FNV_PRIME);
    }
    return hash >>> 0;
}
export class SaveSerializer {
    constructor() {
        this.version = 1;
    }
    serialize(orchestrator) {
        const state = orchestrator.getState();
        const header = {
            version: this.version,
            timestamp: Date.now(),
            turn: state.currentTurn,
            date: state.calendar.toString(),
            checksum: 0,
        };
        const clonedState = deepClone(state);
        clonedState[SCHEMA_VERSION_KEY] = CURRENT_SCHEMA_VERSION;
        const data = { header, state: clonedState };
        const json = JSON.stringify(data);
        const checksum = fnvChecksum(json);
        const finalData = {
            header: { ...header, checksum },
            state: clonedState,
        };
        return JSON.stringify(finalData);
    }
    deserialize(data) {
        const parsed = JSON.parse(data);
        let rawState = parsed.state;
        const version = getSchemaVersion(rawState);
        if (version < CURRENT_SCHEMA_VERSION) {
            rawState = ensureSchemaVersion(rawState, parsed.header);
        }
        const calendar = new GameCalendar(rawState.calendar.year, rawState.calendar.month);
        delete rawState[SCHEMA_VERSION_KEY];
        const state = {
            ...rawState,
            calendar,
        };
        return { header: parsed.header, state };
    }
    validateSave(data) {
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
        }
        catch (e) {
            return { valid: false, error: `Parse failed: ${e}` };
        }
    }
}
//# sourceMappingURL=save_serializer.js.map