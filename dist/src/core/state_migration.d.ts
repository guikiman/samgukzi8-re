import type { SaveHeader } from "./save_serializer";
export declare const CURRENT_SCHEMA_VERSION = 1;
export declare function registerMigration(from: number, to: number, migrate: (state: Record<string, unknown>) => Record<string, unknown>): void;
export declare function migrateState(state: Record<string, unknown>, fromVersion: number, toVersion: number): Record<string, unknown>;
export declare function getMigrationPath(fromVersion: number, toVersion: number): string[];
export declare function ensureSchemaVersion(data: Record<string, unknown>, header: SaveHeader): Record<string, unknown>;
export declare function getSchemaVersion(data: Record<string, unknown>): number;
export declare const SCHEMA_VERSION_KEY = "_schemaVersion";
//# sourceMappingURL=state_migration.d.ts.map