export const CURRENT_SCHEMA_VERSION = 1;
const migrations = [];
export function registerMigration(from, to, migrate) {
    if (from + 1 !== to) {
        throw new Error(`Migration must be sequential (from ${from} → to ${to}), not skip versions`);
    }
    const existing = migrations.findIndex(m => m.from === from || m.to === to);
    if (existing >= 0) {
        throw new Error(`Migration from ${from} to ${to} already registered`);
    }
    migrations.push({ from, to, migrate });
    migrations.sort((a, b) => a.from - b.from);
}
export function migrateState(state, fromVersion, toVersion) {
    let current = { ...state };
    let currentVersion = fromVersion;
    while (currentVersion < toVersion) {
        const step = migrations.find(m => m.from === currentVersion);
        if (!step) {
            throw new Error(`No migration path from version ${currentVersion} to ${currentVersion + 1}`);
        }
        current = step.migrate(current);
        currentVersion = step.to;
    }
    current._schemaVersion = toVersion;
    return current;
}
export function getMigrationPath(fromVersion, toVersion) {
    const path = [];
    let current = fromVersion;
    while (current < toVersion) {
        const step = migrations.find(m => m.from === current);
        if (!step)
            break;
        path.push(step.migrate.name || `v${step.from}_to_v${step.to}`);
        current = step.to;
    }
    return path;
}
export function ensureSchemaVersion(data, header) {
    const version = data._schemaVersion ?? header.version ?? 0;
    if (version < CURRENT_SCHEMA_VERSION) {
        return migrateState(data, version, CURRENT_SCHEMA_VERSION);
    }
    return data;
}
export function getSchemaVersion(data) {
    return data._schemaVersion ?? 0;
}
export const SCHEMA_VERSION_KEY = "_schemaVersion";
//# sourceMappingURL=state_migration.js.map