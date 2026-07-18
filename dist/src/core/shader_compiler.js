/**
 * [Task 54] Shader 컴파일러 및 캐시 — ShaderCompiler
 *
 * 목적: GLSL 셰이더 소스 컴파일, 링크, 캐싱.
 *
 * 핵심 로직:
 *   1. 셰이더 컴파일 + 에러 리포팅
 *   2. 프로그램 링크 + 검증
 *   3. LRU 네임드 프로그램 캐시
 */
export class ShaderCompiler {
    constructor() {
        this.programCache = new Map();
        this.maxCacheSize = 128;
    }
    /**
     * 단일 셰이더 컴파일
     */
    compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        if (!shader)
            throw new Error("[ShaderCompiler] Failed to create shader object");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader) ?? "Unknown compile error";
            const typeName = type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
            gl.deleteShader(shader);
            throw new Error(`[ShaderCompiler] ${typeName} shader compile error:\n${log}`);
        }
        return shader;
    }
    /**
     * 전체 프로그램 생성 (컴파일 + 링크)
     */
    createProgram(gl, vertSource, fragSource) {
        const vertShader = this.compileShader(gl, vertSource, gl.VERTEX_SHADER);
        const fragShader = this.compileShader(gl, fragSource, gl.FRAGMENT_SHADER);
        const program = gl.createProgram();
        if (!program)
            throw new Error("[ShaderCompiler] Failed to create program");
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(program) ?? "Unknown link error";
            gl.deleteProgram(program);
            gl.deleteShader(vertShader);
            gl.deleteShader(fragShader);
            throw new Error(`[ShaderCompiler] Program link error:\n${log}`);
        }
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        return program;
    }
    /**
     * 캐시된 프로그램 조회 (없으면 생성)
     */
    getProgram(gl, name, vertSource, fragSource) {
        const cached = this.programCache.get(name);
        if (cached) {
            cached.lastUsed = performance.now();
            return cached.program;
        }
        // 캐시 한계 초과 시 LRU 제거
        if (this.programCache.size >= this.maxCacheSize) {
            let lruKey = "";
            let lruTime = Infinity;
            for (const [k, v] of this.programCache) {
                if (v.lastUsed < lruTime) {
                    lruTime = v.lastUsed;
                    lruKey = k;
                }
            }
            if (lruKey) {
                const evicted = this.programCache.get(lruKey);
                if (evicted)
                    gl.deleteProgram(evicted.program);
                this.programCache.delete(lruKey);
            }
        }
        const program = this.createProgram(gl, vertSource, fragSource);
        this.programCache.set(name, { program, lastUsed: performance.now() });
        return program;
    }
    /**
     * 배치 프리컴파일
     */
    precompileShaders(gl, shaderDefs) {
        for (const [name, def] of Object.entries(shaderDefs)) {
            try {
                this.getProgram(gl, name, def.vertexSource, def.fragmentSource);
            }
            catch (e) {
                console.warn(`[ShaderCompiler] Precompile failed for "${name}":`, e);
            }
        }
    }
    /**
     * 캐시된 프로그램 수
     */
    get cacheSize() {
        return this.programCache.size;
    }
    /**
     * 특정 프로그램 제거
     */
    evict(name) {
        const entry = this.programCache.get(name);
        if (entry) {
            // WebGL 컨텍스트가 있다면 삭제
            entry.program;
            this.programCache.delete(name);
        }
    }
    /**
     * 전체 캐시 정리
     */
    dispose(gl) {
        if (gl) {
            for (const entry of this.programCache.values()) {
                gl.deleteProgram(entry.program);
            }
        }
        this.programCache.clear();
    }
}
//# sourceMappingURL=shader_compiler.js.map