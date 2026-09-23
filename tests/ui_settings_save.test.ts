/**
 * [461-480] UI 설정 세이브 스냅샷 테스트
 * 파일: tests/ui_settings_save.test.ts
 *
 * SaveSlotManager에 uiSettings를 저장하고 복원하는 라운드트립,
 * 구버전 세이브(null) 호환을 검증한다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSlotManager, type UiSettingsSnapshot } from '../src/core/save_slot_manager.js';

describe('[461-480] UI 설정 세이브 스냅샷', () => {
    let storage: Record<string, string>;

    beforeEach(() => {
        storage = {};
        vi.stubGlobal('localStorage', {
            getItem: (k: string) => storage[k] ?? null,
            setItem: (k: string, v: string) => { storage[k] = v; },
            removeItem: (k: string) => { delete storage[k]; },
        });
    });

    it('uiSettings를 포함해 저장하면 getUiSettings로 복원된다', () => {
        const mgr = new SaveSlotManager();
        const ui: UiSettingsSnapshot = {
            fontMode: 'sans',
            textScale: 1.15,
            screenShake: false,
            showStatNumbers: false,
            colorblindMode: 'deuteranopia',
            colorPattern: 'hatch',
            tutorialDone: true,
        };
        const saveOk = mgr.save(1, 'COMPRESSED_SAVE', {
            year: 192, month: 5, turnCount: 17, factionName: '조조',
            uiSettings: ui,
        });
        expect(saveOk).toBe(true);
        expect(mgr.getUiSettings(1)).toEqual(ui);
    });

    it('uiSettings 없이 저장한 구버전 슬롯은 null을 반환한다', () => {
        const mgr = new SaveSlotManager();
        mgr.save(2, 'OLD_SAVE', {
            year: 190, month: 1, turnCount: 1, factionName: '유비',
        });
        expect(mgr.getUiSettings(2)).toBeNull();
        // 메타 자체는 정상
        expect(mgr.getMeta(2)?.factionName).toBe('유비');
    });

    it('빈 슬롯은 null을 반환한다', () => {
        const mgr = new SaveSlotManager();
        expect(mgr.getUiSettings(3)).toBeNull();
    });

    it('일부 필드만 있는 스냅샷도 저장된다 (선택 필드)', () => {
        const mgr = new SaveSlotManager();
        mgr.save('auto', 'SAVE', {
            year: 200, month: 12, turnCount: 130, factionName: '손책',
            uiSettings: { colorblindMode: 'tritanopia' },
        });
        expect(mgr.getUiSettings('auto')).toEqual({ colorblindMode: 'tritanopia' });
    });
});
