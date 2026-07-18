/**
 * [Task 18] 특수 관계 비트마스크 — RelationBitmask
 *
 * 관계 유형을 비트 플래그로 인코딩하여 O(1) 타입 체크 가능.
 */

import type { RelationType } from "./types.js";

export type RelationBitmask = number;

export const RELATION_NONE = 0;
export const RELATION_FRIEND = 1 << 0;
export const RELATION_RIVAL = 1 << 1;
export const RELATION_SWORN_BROTHER = 1 << 2;
export const RELATION_NEMESIS = 1 << 3;
export const RELATION_FAMILY = 1 << 4;
export const RELATION_SPOUSE = 1 << 5;
export const RELATION_SUBORDINATE = 1 << 6;
export const RELATION_LOVER = 1 << 7;
export const RELATION_MENTOR = 1 << 8;
export const RELATION_DISCIPLE = 1 << 9;
export const RELATION_ALLY = 1 << 10;
export const RELATION_ENEMY = 1 << 11;

export const RELATION_ALL_MASK = RELATION_FRIEND | RELATION_RIVAL | RELATION_SWORN_BROTHER | RELATION_NEMESIS
  | RELATION_FAMILY | RELATION_SPOUSE | RELATION_SUBORDINATE | RELATION_LOVER
  | RELATION_MENTOR | RELATION_DISCIPLE | RELATION_ALLY | RELATION_ENEMY;

export const RELATION_POSITIVE_MASK = RELATION_FRIEND | RELATION_SWORN_BROTHER | RELATION_FAMILY
  | RELATION_SPOUSE | RELATION_LOVER | RELATION_MENTOR | RELATION_DISCIPLE | RELATION_ALLY;

export const RELATION_NEGATIVE_MASK = RELATION_RIVAL | RELATION_NEMESIS | RELATION_ENEMY;

const relationToBit = new Map<RelationType, RelationBitmask>([
  ["FRIEND", RELATION_FRIEND],
  ["RIVAL", RELATION_RIVAL],
  ["SWORN_BROTHER", RELATION_SWORN_BROTHER],
  ["NEMESIS", RELATION_NEMESIS],
  ["FAMILY", RELATION_FAMILY],
  ["SPOUSE", RELATION_SPOUSE],
  ["SUBORDINATE", RELATION_SUBORDINATE],
]);

const bitToRelation = new Map<RelationBitmask, RelationType>([
  [RELATION_FRIEND, "FRIEND"],
  [RELATION_RIVAL, "RIVAL"],
  [RELATION_SWORN_BROTHER, "SWORN_BROTHER"],
  [RELATION_NEMESIS, "NEMESIS"],
  [RELATION_FAMILY, "FAMILY"],
  [RELATION_SPOUSE, "SPOUSE"],
  [RELATION_SUBORDINATE, "SUBORDINATE"],
]);

export function relationTypeToBitmask(type: RelationType): RelationBitmask {
  return relationToBit.get(type) ?? RELATION_NONE;
}

export function bitmaskToRelationTypes(mask: RelationBitmask): RelationType[] {
  const result: RelationType[] = [];
  for (const [bit, type] of bitToRelation) {
    if ((mask & bit) !== 0) result.push(type);
  }
  return result;
}

export function hasRelation(mask: RelationBitmask, type: RelationType): boolean {
  return (mask & relationTypeToBitmask(type)) !== 0;
}

export function addRelation(mask: RelationBitmask, type: RelationType): RelationBitmask {
  return mask | relationTypeToBitmask(type);
}

export function removeRelation(mask: RelationBitmask, type: RelationType): RelationBitmask {
  return mask & ~relationTypeToBitmask(type);
}

export function combineMasks(...masks: RelationBitmask[]): RelationBitmask {
  return masks.reduce((acc, m) => acc | m, RELATION_NONE);
}
