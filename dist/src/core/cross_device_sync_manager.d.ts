/**
 * PC-모바일 동시 접속 및 멀티 디바이스 동기화
 *
 * [1] 세션 페어링 및 OTP 인증 (QR / 6자리 Pairing Code)
 * [2] 결정론적 델타 동기화 (Action Command 브로드캐스트)
 * [3] 컴패니언 스크린 모드 (PC WebGL 메인 + 모바일 컨트롤러)
 * [4] 심리스 세션 이어하기 (Seamless Session Handover)
 *
 * 아키텍처:
 *   PC (WebGL 렌더러) <── Supabase Broadcast Channel ──> Mobile (터치 컨트롤러)
 *                            │
 *                   Room ID: User_Session_xxx
 *                   PRNG Lockstep + Action Delta Sync
 */
import { PRNG } from './network_sync_manager.js';
/** 디바이스 역할 */
export type DeviceRole = 'PC_MAIN' | 'MOBILE_CONTROLLER';
/** 동기화 모드 */
export type SyncMode = 'COMPANION_SCREEN' | 'SESSION_HANDOVER' | 'DISCONNECTED';
/** OTP 페어링 상태 */
export type PairingStatus = 'PENDING' | 'PAIRED' | 'EXPIRED' | 'REJECTED';
/** 동기화 액션 — 한쪽 기기에서 발생한 명령 */
export interface SyncAction {
    readonly type: string;
    readonly payload: Record<string, unknown>;
    readonly timestamp: number;
    readonly deviceId: string;
    readonly actionId: string;
    readonly prngCallCount: number;
    readonly checksum: string;
}
/** OTP 페어링 코드 */
export interface PairingCode {
    readonly code: string;
    readonly roomId: string;
    readonly expiresAt: number;
    readonly status: PairingStatus;
}
/** 디바이스 정보 */
export interface DeviceInfo {
    readonly deviceId: string;
    readonly role: DeviceRole;
    readonly userAgent: string;
    readonly screenWidth: number;
    readonly screenHeight: number;
    readonly connectedAt: number;
    readonly latency: number;
}
/** 세션 상태 스냅샷 */
export interface CrossDeviceSessionState {
    readonly roomId: string;
    readonly primaryDevice: DeviceInfo | null;
    readonly secondaryDevice: DeviceInfo | null;
    readonly syncMode: SyncMode;
    readonly lastSyncAt: number;
    readonly frameLatencyMs: number;
    readonly prngSeed: number;
    readonly prng: PRNG;
}
/** 핸드오버 이벤트 */
export interface HandoverEvent {
    readonly fromDeviceId: string;
    readonly toDeviceId: string;
    readonly capturedFrame: number;
    readonly pendingActions: readonly SyncAction[];
    readonly timestamp: number;
}
export type OnPairingComplete = (code: PairingCode, device: DeviceInfo) => void;
export type OnActionReceived = (action: SyncAction) => void;
export type OnHandover = (event: HandoverEvent) => void;
export type OnSyncStateChange = (mode: SyncMode, prevMode: SyncMode) => void;
export type OnError = (code: string, message: string) => void;
export interface CrossDeviceCallbacks {
    readonly onPairingComplete?: OnPairingComplete;
    readonly onActionReceived: OnActionReceived;
    readonly onHandover?: OnHandover;
    readonly onSyncStateChange?: OnSyncStateChange;
    readonly onError?: OnError;
}
export declare class CrossDeviceSyncManager {
    private supabaseUrl;
    private supabaseKey;
    private channel;
    private sessionState;
    private deviceId;
    private callbacks;
    private pendingActionQueue;
    private handoverInProgress;
    private isAvailable;
    constructor(supabaseUrl: string, supabaseKey: string, onActionReceived: (action: SyncAction) => void);
    setCallbacks(callbacks: Partial<CrossDeviceCallbacks>): void;
    getDeviceId(): string;
    getSessionState(): CrossDeviceSessionState | null;
    getSyncMode(): SyncMode;
    isHandoverInProgress(): boolean;
    /**
     * PC에서 OTP 페어링 코드 생성
     * 6자리 숫자 코드 + Room ID 발급
     */
    generatePairingCode(userId: string): PairingCode;
    /**
     * 모바일/PC에서 OTP 코드로 세션 조인
     */
    joinSessionWithCode(code: string, roomId: string): Promise<boolean>;
    /**
     * QR 코드 데이터 생성 (URL 형식)
     * 모바일에서 스캔하여 자동 접속
     */
    generateQRData(baseUrl: string, code: PairingCode): string;
    /**
     * Supabase Realtime 채널 구독
     * 동일한 Room_ID로 PC와 모바일이 연결
     */
    private connectToRoom;
    /**
     * 한쪽 기기에서 발생한 액션을 상대 기기로 실시간 전송
     *
     * ΔS = S_Mobile ⊕ S_PC
     * 수신 기기는 PRNG Seed로 로컬 상태에 dispatch하여 100% 동일 결과 도출
     * T_latency ≤ 100ms
     */
    broadcastAction(type: string, payload: Record<string, unknown>): Promise<void>;
    /**
     * 수신된 액션 처리
     * PRNG 동기화 + 체크섬 검증
     */
    private handleIncomingAction;
    /**
     * Heartbeat 전송 — 레이턴시 측정
     */
    sendHeartbeat(): Promise<void>;
    /**
     * PC를 메인(WebGL), 모바일을 컨트롤러로 설정
     */
    setCompanionScreenMode(role: DeviceRole): Promise<void>;
    /**
     * PC → 모바일 (또는 모바일 → PC) 세션 핸드오버 요청
     *
     * 1. 현재 디바이스가 대기(잠금) 상태로 전환
     * 2. 상대 디바이스로 컨트롤 권한 이양
     * 3. 모든 미처리 액션 큐 전송
     */
    requestHandover(targetDeviceId: string): Promise<void>;
    /**
     * 핸드오버 요청 수신 처리
     */
    private handleHandoverRequest;
    private handleHandoverAccept;
    private broadcastDeviceInfo;
    private handleDeviceInfo;
    private detectRole;
    private computeActionChecksum;
    private queuePendingAction;
    getPendingActions(): readonly SyncAction[];
    disconnectSession(): void;
}
//# sourceMappingURL=cross_device_sync_manager.d.ts.map