/**
 * [Task 18] 특수 관계 비트마스크 — RelationBitmask
 *
 * 관계 유형을 비트 플래그로 인코딩하여 O(1) 타입 체크 가능.
 */
import type { RelationType } from "./types.js";
export type RelationBitmask = number;
export declare const RELATION_NONE = 0;
export declare const RELATION_FRIEND: number;
export declare const RELATION_RIVAL: number;
export declare const RELATION_SWORN_BROTHER: number;
export declare const RELATION_NEMESIS: number;
export declare const RELATION_FAMILY: number;
export declare const RELATION_SPOUSE: number;
export declare const RELATION_SUBORDINATE: number;
export declare const RELATION_LOVER: number;
export declare const RELATION_MENTOR: number;
export declare const RELATION_DISCIPLE: number;
export declare const RELATION_ALLY: number;
export declare const RELATION_ENEMY: number;
export declare const RELATION_ALL_MASK: number;
export declare const RELATION_POSITIVE_MASK: number;
export declare const RELATION_NEGATIVE_MASK: number;
export declare function relationTypeToBitmask(type: RelationType): RelationBitmask;
export declare function bitmaskToRelationTypes(mask: RelationBitmask): RelationType[];
export declare function hasRelation(mask: RelationBitmask, type: RelationType): boolean;
export declare function addRelation(mask: RelationBitmask, type: RelationType): RelationBitmask;
export declare function removeRelation(mask: RelationBitmask, type: RelationType): RelationBitmask;
export declare function combineMasks(...masks: RelationBitmask[]): RelationBitmask;
//# sourceMappingURL=relation_bitmask.d.ts.map