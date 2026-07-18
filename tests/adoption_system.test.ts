import { describe, it, expect, beforeEach } from 'vitest';
import { AdoptionSystem } from '../src/core/adoption_system';

describe('AdoptionSystem', () => {
    let system: AdoptionSystem;

    beforeEach(() => {
        system = new AdoptionSystem();
    });

    it('should adopt a child successfully', () => {
        const result = system.adopt('parent_1', 'child_1', 200, 1);
        expect(result.success).toBe(true);
        expect(result.record).toBeDefined();
        expect(result.record!.id).toBeDefined();
    });

    it('should reject self-adoption', () => {
        const result = system.adopt('self', 'self', 200, 1);
        expect(result.success).toBe(false);
    });

    it('should track parent-child relationships', () => {
        system.adopt('parent_1', 'child_1', 200, 1);
        const parents = system.getAdoptiveParents('child_1');
        expect(parents).toContain('parent_1');
        const children = system.getAdoptiveChildren('parent_1');
        expect(children).toContain('child_1');
    });

    it('should check adoptive relation', () => {
        system.adopt('parent_1', 'child_1', 200, 1);
        expect(system.isAdoptiveRelation('parent_1', 'child_1')).toBe(true);
        expect(system.isAdoptiveRelation('child_1', 'parent_1')).toBe(true);
        expect(system.isAdoptiveRelation('parent_1', 'child_2')).toBe(false);
    });

    it('should disown a child', () => {
        const adoptResult = system.adopt('parent_1', 'child_1', 200, 1);
        const disownResult = system.disown(adoptResult.record!.id, 205);
        expect(disownResult.success).toBe(true);
        expect(system.isAdoptiveRelation('parent_1', 'child_1')).toBe(false);
    });

    it('should get records for an officer', () => {
        system.adopt('parent_1', 'child_1', 200, 1);
        const records = system.getRecordsForOfficer('parent_1');
        expect(records.length).toBe(1);
        expect(records[0].childId).toBe('child_1');
    });

    it('should restore records from save', () => {
        system.adopt('parent_1', 'child_1', 200, 1);
        const saved = system.getAllRecords();
        const newSystem = new (AdoptionSystem as any)();
        newSystem.restoreRecords(saved);
        expect(newSystem.isAdoptiveRelation('parent_1', 'child_1')).toBe(true);
    });

    it('should clear all records', () => {
        system.adopt('parent_1', 'child_1', 200, 1);
        system.clear();
        expect(system.getAllRecords().length).toBe(0);
    });
});
