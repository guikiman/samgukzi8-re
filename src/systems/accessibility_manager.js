/**
 * [Phase 26] 접근성 관리자 — Accessibility Manager
 * 파일: src/systems/accessibility_manager.js
 * 
 * 설계 스펙:
 * - [469] 색약 모드 필터
 */

export class AccessibilityManager {
    constructor() {
        this.colorBlindMode = "NONE"; // NONE, PROTANOPIA, DEUTERANOPIA
    }

    applyColorBlindFilter(filterType) {
        this.colorBlindMode = filterType;
        console.log(`Filter applied: ${filterType}`);
    }
}
