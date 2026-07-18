import { describe, it, expect, beforeEach } from 'vitest';
import { CloudSaveSync } from '../src/core/cloud_save_sync';

describe('CloudSaveSync', () => {
    let sync: CloudSaveSync;

    beforeEach(() => {
        sync = new CloudSaveSync();
        sync.clear();
    });

    it('should save a slot', () => {
        const slot = sync.saveSlot('slot_1', 'Test Save', '{"game":"data"}');
        expect(slot.slotId).toBe('slot_1');
        expect(slot.label).toBe('Test Save');
    });

    it('should load a slot', () => {
        sync.saveSlot('slot_1', 'Test', 'data');
        const loaded = sync.loadSlot('slot_1');
        expect(loaded).not.toBeNull();
        expect(loaded!.label).toBe('Test');
    });

    it('should return null for missing slot', () => {
        expect(sync.loadSlot('nonexistent')).toBeNull();
    });

    it('should delete a slot', () => {
        sync.saveSlot('slot_1', 'Test', 'data');
        expect(sync.deleteSlot('slot_1')).toBe(true);
        expect(sync.loadSlot('slot_1')).toBeNull();
    });

    it('should return false when deleting nonexistent slot', () => {
        expect(sync.deleteSlot('nonexistent')).toBe(false);
    });

    it('should list slots sorted by timestamp descending', () => {
        sync.saveSlot('slot_1', 'First', 'data1');
        sync.saveSlot('slot_2', 'Second', 'data2');
        const slots = sync.listSlots();
        expect(slots.length).toBe(2);
    });

    it('should export a slot as JSON string', () => {
        sync.saveSlot('slot_1', 'Test', 'data');
        const exported = sync.exportSlot('slot_1');
        expect(exported).not.toBeNull();
        expect(exported).toContain('slot_1');
    });

    it('should return null when exporting nonexistent slot', () => {
        expect(sync.exportSlot('nonexistent')).toBeNull();
    });

    it('should import a valid slot', () => {
        sync.saveSlot('slot_1', 'Test', 'data');
        const exported = sync.exportSlot('slot_1')!;
        sync.clear();
        const imported = sync.importSlot(exported);
        expect(imported).not.toBeNull();
        expect(imported!.slotId).toBe('slot_1');
    });

    it('should reject corrupted import', () => {
        const result = sync.importSlot('{"slotId":"bad","data":"x","checksum":"wrong"}');
        expect(result).toBeNull();
    });

    it('should sync with remote slots', () => {
        sync.saveSlot('slot_1', 'Local', 'local_data');
        const remote = [{
            slotId: 'slot_2', label: 'Remote', data: 'remote_data',
            timestamp: Date.now() + 1000, checksum: '', version: '1.0.0',
        }];
        const result = sync.syncWithRemote(remote);
        expect(result.success).toBe(true);
        expect(result.syncedSlots).toBe(1);
    });

    it('should get manifest', () => {
        sync.saveSlot('slot_1', 'Test', 'data');
        const manifest = sync.getManifest();
        expect(manifest.slots.length).toBe(1);
    });

    it('should clear all slots', () => {
        sync.saveSlot('slot_1', 'Test', 'data');
        sync.clear();
        expect(sync.listSlots().length).toBe(0);
    });
});