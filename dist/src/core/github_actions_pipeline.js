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
const PIPELINE_STAGES = ['TYPECHECK', 'TEST', 'LINT', 'BUILD', 'DEPLOY'];
export class GithubActionsPipeline {
    /**
     * CI/CD 파이프라인 실행 (CLI 명령어 래퍼)
     *
     * @param stages 실행할 스테이지 목록 (기본값: 전체)
     */
    async run(stages = PIPELINE_STAGES) {
        const results = [];
        for (const stage of stages) {
            const start = Date.now();
            let passed = false;
            let output = '';
            try {
                switch (stage) {
                    case 'TYPECHECK':
                        output = await this.runTypeCheck();
                        passed = true;
                        break;
                    case 'TEST':
                        output = await this.runTests();
                        passed = true;
                        break;
                    case 'LINT':
                        output = await this.runLint();
                        passed = true;
                        break;
                    case 'BUILD':
                        output = await this.runBuild();
                        passed = true;
                        break;
                    case 'DEPLOY':
                        output = await this.runDeploy();
                        passed = true;
                        break;
                }
            }
            catch (err) {
                output = String(err);
                passed = false;
                // DEPLOY를 제외한 실패 시 파이프라인 중단
                if (stage !== 'DEPLOY') {
                    results.push({ name: stage, passed, durationMs: Date.now() - start, output });
                    return { success: false, stages: results };
                }
            }
            results.push({ name: stage, passed, durationMs: Date.now() - start, output });
        }
        return { success: results.every(r => r.passed), stages: results };
    }
    /** GitHub Actions YAML 생성 */
    generateActionsYaml() {
        return `name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx vitest run
      - run: npx eslint .
      - run: npm run build
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: npm run deploy`;
    }
    // 실행 스텁 (실제론 child_process 사용)
    async runCommand(_cmd) {
        return '[stub] command executed';
    }
    async runTypeCheck() { return this.runCommand('npx tsc --noEmit'); }
    async runTests() { return this.runCommand('npx vitest run'); }
    async runLint() { return this.runCommand('npx eslint .'); }
    async runBuild() { return this.runCommand('npm run build'); }
    async runDeploy() { return this.runCommand('npm run deploy'); }
}
//# sourceMappingURL=github_actions_pipeline.js.map