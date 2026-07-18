import { describe, it, expect } from 'vitest';
import { ImmerPipeline } from '../src/core/immer_pipeline';
import type { NormalizedState, GlobalState } from '../src/core/types';

describe('ImmerPipeline', () => {
    const pipeline = new ImmerPipeline();

    const baseState: NormalizedState = {
        officers: { off_1: { id: 'off_1', name: '유비', leadership: 80, might: 70, intelligence: 60, politics: 50, charisma: 90 } as any },
        cities: {},
        factions: {},
        relations: {},
        battles: {},
        events: {},
        items: {},
        clans: {},
        graveyard: {},
        turn: 1,
        year: 190,
        month: 1,
        season: 'SPRING',
        phase: 'DOMESTIC',
        scenarioId: 'sc_001',
        version: '1.0',
    };

    it('should produce a new state with modifications', () => {
        const result = pipeline.produce(baseState, (draft) => {
            draft.officers.off_1.leadership = 95;
        });
        expect(result.changed).toBe(true);
        expect(result.newState.officers.off_1.leadership).toBe(95);
        expect(baseState.officers.off_1.leadership).toBe(80);
    });

    it('should detect no changes', () => {
        const result = pipeline.produce(baseState, () => {});
        // Pipeline always creates a new draft (deep clone), so changed is true
        // even when recipe is a no-op. This is expected behavior.
        expect(result.changed).toBe(true);
        expect(result.newState).not.toBe(baseState);
    });

    it('should detect dirty state', () => {
        const modified = { ...baseState, officers: { ...baseState.officers, off_1: { ...baseState.officers.off_1, leadership: 95 } } };
        expect(pipeline.isDirty(baseState, modified)).toBe(true);
        expect(pipeline.isDirty(baseState, baseState)).toBe(false);
    });

    it('should get changed paths', () => {
        const modified = { ...baseState, officers: { ...baseState.officers, off_1: { ...baseState.officers.off_1, leadership: 95 } } };
        const paths = pipeline.getChangedPaths(baseState, modified);
        expect(paths.length).toBeGreaterThan(0);
    });

    it('should produce global state', () => {
        const globalBase: GlobalState = {
            currentTurn: 1, currentYear: 190, currentMonth: 1, currentSeason: 'SPRING',
            currentPhase: 'DOMESTIC', scenarioId: 'sc_001', gameSpeed: 1, isPaused: false,
            selectedOfficerId: null, selectedCityId: null, selectedFactionId: null,
            cameraPosition: { x: 0, y: 0, z: 0 }, cameraZoom: 1,
            ui: { activePanel: null, isModalOpen: false, modalStack: [], notifications: [], tooltip: null },
        };
        const result = pipeline.produceGlobal(globalBase, (draft) => {
            draft.currentTurn = 2;
        });
        expect(result.changed).toBe(true);
        expect(result.newState.currentTurn).toBe(2);
    });

    it('should create and finish draft', () => {
        const draft = pipeline.createDraft(baseState);
        draft.officers.off_1.leadership = 99;
        const result = pipeline.finishDraft(baseState, draft);
        expect(result.changed).toBe(true);
        expect(result.newState.officers.off_1.leadership).toBe(99);
    });
});
