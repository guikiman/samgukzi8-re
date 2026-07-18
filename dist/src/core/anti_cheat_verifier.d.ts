/**
 * 삼국지 8 리메이크 — 서버 사이드 결정론적 검증 시스템
 * 파일: src/core/anti_cheat_verifier.ts
 *
 * [202] 결정론적 액션 로그 기반 서버 사이드 복사 시뮬레이션
 * [203] 해킹 감지 시 예외 처리 (Desync / Checksum 불일치)
 *
 * ── 아키텍처 ──
 *
 * 클라이언트:
 *   1. 초기 seed로 PRNG 초기화
 *   2. 매 턴 ActionLog 기록 (커맨드 + PRNG call count)
 *   3. 최종 상태 체크섬 계산 → 서버 전송
 *
 * 서버 (AntiCheatVerifier):
 *   1. 동일 seed로 PRNG 복제
 *   2. ActionLog를 순차적으로 Replay
 *   3. 동일 전투 공식으로 상태 재현
 *   4. 최종 체크섬을 클라이언트 제출값과 비교
 *   5. 불일치 → DesyncException → 매치 무효화 + 디버깅 로그
 *
 * ── 결정론성 보장 ──
 *   - PRNG: 동일 seed + 동일 call count → 동일 난수열
 *   - 전투 공식: 동일 입력 → 동일 출력 (부동소수점 연산 일치)
 *   - 체크섬: FNV-1a (Wasm 폴백과 동일 알고리즘)
 */
/** 액션 타입 */
export type ActionType = 'MOVE_UNIT' | 'ATTACK' | 'DEFEND' | 'USE_SKILL' | 'RETREAT' | 'DEPLOY' | 'REINFORCE' | 'USE_ITEM' | 'WAIT';
/** 단일 액션 로그 엔트리 */
export interface ActionLogEntry {
    readonly turn: number;
    readonly actionType: ActionType;
    readonly actorId: number;
    readonly targetId?: number;
    readonly params: readonly number[];
    readonly prngCallCount: number;
}
/** 전체 액션 로그 (클라이언트 → 서버) */
export interface ActionLog {
    readonly seed: number;
    readonly entries: readonly ActionLogEntry[];
    readonly finalChecksum: number;
    readonly matchId: string;
    readonly playerId: string;
    readonly timestamp: number;
}
/** 검증 결과 */
export interface VerificationResult {
    readonly matchId: string;
    readonly playerId: string;
    readonly verified: boolean;
    readonly serverChecksum: number;
    readonly clientChecksum: number;
    readonly desyncTurn: number | null;
    readonly desyncAction: number | null;
    readonly debugLog: readonly string[];
}
/** 체크섬 불일치 예외 */
export declare class ChecksumMismatchError extends Error {
    readonly matchId: string;
    readonly playerId: string;
    readonly serverChecksum: number;
    readonly clientChecksum: number;
    readonly desyncTurn: number;
    readonly desyncAction: number;
    constructor(matchId: string, playerId: string, serverChecksum: number, clientChecksum: number, desyncTurn: number, desyncAction: number);
}
/**
 * AntiCheatVerifier — 서버 사이드 결정론적 액션 로그 Replay 검증기
 *
 * ── 검증 프로토콜 ──
 *
 * 1. 클라이언트가 매치 종료 후 서버에 전송:
 *    - 초기 seed
 *    - 전체 ActionLog (턴별 커맨드 목록)
 *    - 최종 체크섬 (FNV-1a of final game state)
 *
 * 2. 서버 (AntiCheatVerifier):
 *    a. 동일 seed로 PRNG 복제
 *    b. ActionLog를 순차적으로 Replay
 *    c. 각 액션 실행 전 PRNG call count 일치 확인
 *    d. 동일 전투 공식으로 상태 재현
 *    e. 최종 체크섬 계산
 *    f. 클라이언트 체크섬과 비교
 *    g. 불일치 → ChecksumMismatchError + 디버깅 로그
 *
 * ── 결정론성 보장 메커니즘 ──
 *   - PRNG: LCG + Mulberry32, 동일 seed + 동일 call count → 동일 난수열
 *   - 전투 공식: 부동소수점 연산 순서 고정 (IEEE 754)
 *   - 체크섬: FNV-1a (비트 단위 일치)
 *   - 액션 로그: 각 액션의 PRNG call count를 기록하여 중간 상태 검증
 */
export declare class AntiCheatVerifier {
    private readonly prng;
    private readonly _debugLog;
    private _verified;
    private _result;
    constructor();
    /**
     * 클라이언트 액션 로그를 서버에서 Replay 검증
     *
     * @param actionLog  클라이언트가 제출한 전체 액션 로그
     * @returns          검증 결과
     * @throws           ChecksumMismatchError (desync 감지 시)
     */
    verify(actionLog: ActionLog): VerificationResult;
    /**
     * 단일 액션을 결정론적으로 Replay
     *
     * 각 액션 타입별로 PRNG를 사용하는 모든 연산을
     * 클라이언트와 동일한 순서로 실행하여 난수열 동기화 유지
     */
    private replayAction;
    /**
     * 단일 액션의 중간 체크섬 계산
     *
     * 결정론적 입력:
     *   - actionType (string → byte)
     *   - actorId
     *   - targetId
     *   - params
     *   - prngCallCount
     *   - 현재 PRNG state
     */
    private computeActionChecksum;
    /**
     * FNV-1a 해시 업데이트 (32비트 정수)
     */
    private fnvUpdate;
    /**
     * 두 체크섬을 결합 (FNV-1a 기반)
     */
    private combineChecksum;
    private log;
    get debugLog(): readonly string[];
    /** 마지막 검증 결과 */
    get lastResult(): VerificationResult | null;
}
/**
 * ActionLog의 기본 무결성 검증 (전송 전/후)
 *
 * @param log  검증할 ActionLog
 * @returns    오류 메시지 배열 (비어있으면 정상)
 */
export declare function validateActionLog(log: ActionLog): string[];
/**
 * ActionLog의 FNV-1a 체크섬 계산 (클라이언트/서버 동일 알고리즘)
 *
 * @param log  ActionLog
 * @returns    32비트 체크섬
 */
export declare function computeActionLogChecksum(log: ActionLog): number;
//# sourceMappingURL=anti_cheat_verifier.d.ts.map