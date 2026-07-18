/**
 * [Task 76] 멀티 텍스처 바인더 — MultiTextureBinder
 *
 * 목적: WebGL 텍스처 유닛 관리를 추상화하여
 *       다중 텍스처 바인딩을 단순화.
 *
 * 핵심 로직:
 *   1. 텍스처 유닛 할당/해제 (최대 gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
 *   2. 텍스처-유닛 바인딩 캐시
 *   3. 유닛 부족 시 LRU 기반 해제
 */
export class MultiTextureBinder {
    constructor() {
        this.gl = null;
        this.bindings = new Map();
        this.unitPool = [];
        this.maxUnits = 16;
    }
    /**
     * WebGL 컨텍스트 연결
     */
    bindContext(gl) {
        this.gl = gl;
        this.maxUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        this.unitPool = Array.from({ length: this.maxUnits }, (_, i) => i);
    }
    /**
     * 텍스처를 특정 이름으로 바인딩
     */
    bind(name, texture) {
        const existing = this.bindings.get(name);
        if (existing) {
            existing.lastUsed = performance.now();
            return existing.unit;
        }
        if (this.unitPool.length === 0) {
            this.evictLRU();
        }
        const unit = this.unitPool.shift();
        if (unit === undefined || !this.gl)
            return null;
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.bindings.set(name, { texture, unit, lastUsed: performance.now() });
        return unit;
    }
    /**
     * 바인딩 해제
     */
    unbind(name) {
        const binding = this.bindings.get(name);
        if (binding) {
            this.unitPool.push(binding.unit);
            this.bindings.delete(name);
        }
    }
    /**
     * 모든 바인딩 해제
     */
    unbindAll() {
        this.bindings.clear();
        this.unitPool = Array.from({ length: this.maxUnits }, (_, i) => i);
    }
    /**
     * 특정 이름의 텍스처 유닛 번호 조회
     */
    getUnit(name) {
        return this.bindings.get(name)?.unit;
    }
    /**
     * 사용 중인 바인딩 수
     */
    get activeBindings() {
        return this.bindings.size;
    }
    evictLRU() {
        let lruName = "";
        let lruTime = Infinity;
        for (const [name, binding] of this.bindings) {
            if (binding.lastUsed < lruTime) {
                lruTime = binding.lastUsed;
                lruName = name;
            }
        }
        if (lruName) {
            this.unbind(lruName);
        }
    }
}
//# sourceMappingURL=multi_texture_binder.js.map