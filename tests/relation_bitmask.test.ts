import { describe, it, expect } from 'vitest';
import {
    relationTypeToBitmask, bitmaskToRelationTypes, hasRelation,
    addRelation, removeRelation, combineMasks,
    RELATION_NONE, RELATION_FRIEND, RELATION_RIVAL, RELATION_SWORN_BROTHER,
    RELATION_NEMESIS, RELATION_FAMILY, RELATION_SPOUSE,
    RELATION_POSITIVE_MASK, RELATION_NEGATIVE_MASK,
} from '../src/core/relation_bitmask';

describe('relation_bitmask', () => {
    it('should convert RelationType to bitmask', () => {
        expect(relationTypeToBitmask('FRIEND')).toBe(RELATION_FRIEND);
        expect(relationTypeToBitmask('RIVAL')).toBe(RELATION_RIVAL);
        expect(relationTypeToBitmask('SWORN_BROTHER')).toBe(RELATION_SWORN_BROTHER);
    });

    it('should convert bitmask back to RelationTypes', () => {
        const types = bitmaskToRelationTypes(RELATION_FRIEND | RELATION_RIVAL);
        expect(types).toContain('FRIEND');
        expect(types).toContain('RIVAL');
    });

    it('should check hasRelation correctly', () => {
        const mask = RELATION_FRIEND | RELATION_SWORN_BROTHER;
        expect(hasRelation(mask, 'FRIEND')).toBe(true);
        expect(hasRelation(mask, 'RIVAL')).toBe(false);
        expect(hasRelation(mask, 'SWORN_BROTHER')).toBe(true);
    });

    it('should add relation to mask', () => {
        let mask = RELATION_NONE;
        mask = addRelation(mask, 'FRIEND');
        expect(hasRelation(mask, 'FRIEND')).toBe(true);
        mask = addRelation(mask, 'SPOUSE');
        expect(hasRelation(mask, 'SPOUSE')).toBe(true);
    });

    it('should remove relation from mask', () => {
        let mask = RELATION_FRIEND | RELATION_RIVAL;
        mask = removeRelation(mask, 'FRIEND');
        expect(hasRelation(mask, 'FRIEND')).toBe(false);
        expect(hasRelation(mask, 'RIVAL')).toBe(true);
    });

    it('should combine multiple masks', () => {
        const combined = combineMasks(RELATION_FRIEND, RELATION_SWORN_BROTHER, RELATION_FAMILY);
        expect(hasRelation(combined, 'FRIEND')).toBe(true);
        expect(hasRelation(combined, 'SWORN_BROTHER')).toBe(true);
        expect(hasRelation(combined, 'FAMILY')).toBe(true);
        expect(hasRelation(combined, 'RIVAL')).toBe(false);
    });

    it('should have positive mask include positive relations', () => {
        expect(hasRelation(RELATION_POSITIVE_MASK, 'FRIEND')).toBe(true);
        expect(hasRelation(RELATION_POSITIVE_MASK, 'SWORN_BROTHER')).toBe(true);
        expect(hasRelation(RELATION_POSITIVE_MASK, 'RIVAL')).toBe(false);
        expect(hasRelation(RELATION_POSITIVE_MASK, 'NEMESIS')).toBe(false);
    });

    it('should have negative mask include negative relations', () => {
        expect(hasRelation(RELATION_NEGATIVE_MASK, 'RIVAL')).toBe(true);
        expect(hasRelation(RELATION_NEGATIVE_MASK, 'NEMESIS')).toBe(true);
        expect(hasRelation(RELATION_NEGATIVE_MASK, 'FRIEND')).toBe(false);
    });

    it('should return empty array for NONE mask', () => {
        expect(bitmaskToRelationTypes(RELATION_NONE).length).toBe(0);
    });
});
