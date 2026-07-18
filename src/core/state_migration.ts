import type { GameState, FactionState, OfficerState, CityState } from "./sisyphus_orchestrator";
import type { SaveHeader } from "./save_serializer";

export const CURRENT_SCHEMA_VERSION = 1;

interface MigrationStep {
  from: number;
  to: number;
  migrate: (state: Record<string, unknown>) => Record<string, unknown>;
}

const migrations: MigrationStep[] = [];

export function registerMigration(from: number, to: number, migrate: (state: Record<string, unknown>) => Record<string, unknown>): void {
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

export function migrateState(state: Record<string, unknown>, fromVersion: number, toVersion: number): Record<string, unknown> {
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

export function getMigrationPath(fromVersion: number, toVersion: number): string[] {
  const path: string[] = [];
  let current = fromVersion;
  while (current < toVersion) {
    const step = migrations.find(m => m.from === current);
    if (!step) break;
    path.push(step.migrate.name || `v${step.from}_to_v${step.to}`);
    current = step.to;
  }
  return path;
}

export function ensureSchemaVersion(data: Record<string, unknown>, header: SaveHeader): Record<string, unknown> {
  const version = data._schemaVersion as number ?? header.version ?? 0;
  if (version < CURRENT_SCHEMA_VERSION) {
    return migrateState(data, version, CURRENT_SCHEMA_VERSION);
  }
  return data;
}

export function getSchemaVersion(data: Record<string, unknown>): number {
  return (data._schemaVersion as number) ?? 0;
}

export const SCHEMA_VERSION_KEY = "_schemaVersion";