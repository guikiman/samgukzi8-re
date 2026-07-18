/**
 * [E41] 지속적 정적 분석 및 무결성 CI/CD — GithubActionsPipeline
 *
 * 목적: 깃허브 코드 푸시 시 자동 코드 검수 후 웹 호스팅 배포.
 *
 * 핵심 로직:
 *   1. tsc --noEmit 타입 에러 검사
 *   2. vitest 유닛 테스트
 *   3. eslint 룰셋 통과 시 Production 빌드 후 배포
 */
export interface PipelineResult {
    readonly success: boolean;
    readonly stages: PipelineStageResult[];
}
export interface PipelineStageResult {
    readonly name: string;
    readonly passed: boolean;
    readonly durationMs: number;
    readonly output: string;
}
export type PipelineStage = 'TYPECHECK' | 'TEST' | 'LINT' | 'BUILD' | 'DEPLOY';
export declare class GithubActionsPipeline {
    /**
     * CI/CD 파이프라인 실행 (CLI 명령어 래퍼)
     *
     * @param stages 실행할 스테이지 목록 (기본값: 전체)
     */
    run(stages?: PipelineStage[]): Promise<PipelineResult>;
    /** GitHub Actions YAML 생성 */
    generateActionsYaml(): string;
    private runCommand;
    private runTypeCheck;
    private runTests;
    private runLint;
    private runBuild;
    private runDeploy;
}
//# sourceMappingURL=github_actions_pipeline.d.ts.map