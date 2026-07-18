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
export interface ShaderDef {
    readonly vertexSource: string;
    readonly fragmentSource: string;
}
export declare class ShaderCompiler {
    private programCache;
    private readonly maxCacheSize;
    /**
     * 단일 셰이더 컴파일
     */
    compileShader(gl: WebGL2RenderingContext, source: string, type: GLenum): WebGLShader;
    /**
     * 전체 프로그램 생성 (컴파일 + 링크)
     */
    createProgram(gl: WebGL2RenderingContext, vertSource: string, fragSource: string): WebGLProgram;
    /**
     * 캐시된 프로그램 조회 (없으면 생성)
     */
    getProgram(gl: WebGL2RenderingContext, name: string, vertSource: string, fragSource: string): WebGLProgram;
    /**
     * 배치 프리컴파일
     */
    precompileShaders(gl: WebGL2RenderingContext, shaderDefs: Record<string, ShaderDef>): void;
    /**
     * 캐시된 프로그램 수
     */
    get cacheSize(): number;
    /**
     * 특정 프로그램 제거
     */
    evict(name: string): void;
    /**
     * 전체 캐시 정리
     */
    dispose(gl?: WebGL2RenderingContext): void;
}
//# sourceMappingURL=shader_compiler.d.ts.map