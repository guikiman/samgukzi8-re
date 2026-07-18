import { describe, it, expect } from 'vitest';
import { ModSchemaValidator } from '../src/core/mod_schema_validator';

describe('ModSchemaValidator', () => {
    const validator = new ModSchemaValidator();

    it('should validate valid officer data', () => {
        const result = validator.validateOfficer({
            id: 'off_001', name: '관우',
            stats: { might: 97, intelligence: 75, politics: 40, charisma: 80 },
        });
        expect(result.valid).toBe(true);
    });

    it('should reject officer without id', () => {
        const result = validator.validateOfficer({ name: '테스트', stats: { might: 50, intelligence: 50, politics: 50, charisma: 50 } });
        expect(result.valid).toBe(false);
    });

    it('should reject officer with invalid stat range', () => {
        const result = validator.validateOfficer({
            id: 'off_001', name: '테스트',
            stats: { might: 999, intelligence: 50, politics: 50, charisma: 50 },
        });
        expect(result.valid).toBe(false);
    });

    it('should validate valid event data', () => {
        const result = validator.validateEvent({
            id: 'evt_001', trigger: { type: 'YEAR' }, conditions: [], year: 190,
        });
        expect(result.valid).toBe(true);
    });

    it('should reject event without trigger', () => {
        const result = validator.validateEvent({ id: 'evt_001' });
        expect(result.valid).toBe(false);
    });

    it('should validate valid city data', () => {
        const result = validator.validateCity({ id: 'city_001', name: '허창', development: 70, commerce: 60, defense: 50 });
        expect(result.valid).toBe(true);
    });

    it('should reject city with invalid development', () => {
        const result = validator.validateCity({ id: 'city_001', name: '테스트', development: -1 });
        expect(result.valid).toBe(false);
    });

    it('should validate valid item data', () => {
        const result = validator.validateItem({ id: 'item_001', name: '청룡언월도', type: 'WEAPON' });
        expect(result.valid).toBe(true);
    });

    it('should reject item with invalid type', () => {
        const result = validator.validateItem({ id: 'item_001', name: '테스트', type: 'INVALID' });
        expect(result.valid).toBe(false);
    });

    it('should validate full mod package', () => {
        const result = validator.validateModPackage({
            name: '테스트 모드', version: '1.0.0',
            officers: [{ id: 'off_001', name: '관우', stats: { might: 97, intelligence: 75, politics: 40, charisma: 80 } }],
            events: [{ id: 'evt_001', trigger: { type: 'YEAR' }, conditions: [], year: 190 }],
            cities: [{ id: 'city_001', name: '허창' }],
        });
        expect(result.valid).toBe(true);
    });

    it('should report errors in mod package', () => {
        const result = validator.validateModPackage({
            name: '테스트 모드', version: '1.0.0',
            officers: [{ name: '무명' }],
        });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});
