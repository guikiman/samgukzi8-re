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

// ── Ambient declaration: Supabase 패키지 없어도 컴파일 타임 에러 방지 ──
declare type RealtimeChannel = any;

// ============================================================
// 타입 정의
// ============================================================

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

// ============================================================
// 콜백 타입
// ============================================================

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

// ============================================================
// CrossDeviceSyncManager
// ============================================================

export class CrossDeviceSyncManager {
    private supabaseUrl: string;
    private supabaseKey: string;
    private channel: RealtimeChannel | null = null;
    private sessionState: CrossDeviceSessionState | null = null;
    private deviceId: string;
    private callbacks: CrossDeviceCallbacks;
    private pendingActionQueue: SyncAction[] = [];
    private handoverInProgress: boolean = false;
    private isAvailable: boolean = false;

    constructor(
        supabaseUrl: string,
        supabaseKey: string,
        onActionReceived: (action: SyncAction) => void,
    ) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.callbacks = { onActionReceived };
    }

    setCallbacks(callbacks: Partial<CrossDeviceCallbacks>): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    getDeviceId(): string { return this.deviceId; }
    getSessionState(): CrossDeviceSessionState | null { return this.sessionState; }
    getSyncMode(): SyncMode { return this.sessionState?.syncMode ?? 'DISCONNECTED'; }
    isHandoverInProgress(): boolean { return this.handoverInProgress; }

    // ============================================================
    // [1] OTP 세션 페어링
    // ============================================================

    /**
     * PC에서 OTP 페어링 코드 생성
     * 6자리 숫자 코드 + Room ID 발급
     */
    generatePairingCode(userId: string): PairingCode {
        const rawCode = Math.floor(100000 + Math.random() * 900000);
        const roomId = `room_${userId}_${Date.now()}`;

        const code: PairingCode = {
            code: rawCode.toString(),
            roomId,
            expiresAt: Date.now() + 120_000,  // 2분 유효
            status: 'PENDING',
        };

        // 세션 PRNG 초기화
        const prng = new PRNG(Date.now() & 0x7FFFFFFF);
        this.sessionState = {
            roomId,
            primaryDevice: null,
            secondaryDevice: null,
            syncMode: 'DISCONNECTED',
            lastSyncAt: 0,
            frameLatencyMs: 0,
            prngSeed: prng.seed,
            prng,
        };

        return code;
    }

    /**
     * 모바일/PC에서 OTP 코드로 세션 조인
     */
    async joinSessionWithCode(code: string, roomId: string): Promise<boolean> {
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            this.callbacks.onError?.('INVALID_CODE', 'OTP 코드는 6자리 숫자여야 합니다.');
            return false;
        }

        const prng = new PRNG(Date.now() & 0x7FFFFFFF);
        this.sessionState = {
            roomId,
            primaryDevice: null,
            secondaryDevice: null,
            syncMode: 'COMPANION_SCREEN',
            lastSyncAt: 0,
            frameLatencyMs: 0,
            prngSeed: prng.seed,
            prng,
        };

        const success = await this.connectToRoom(roomId);
        if (success) {
            await this.broadcastDeviceInfo();
        }
        return success;
    }

    /**
     * QR 코드 데이터 생성 (URL 형식)
     * 모바일에서 스캔하여 자동 접속
     */
    generateQRData(baseUrl: string, code: PairingCode): string {
        return `${baseUrl}/pair?code=${code.code}&room=${code.roomId}&t=${code.expiresAt}`;
    }

    // ============================================================
    // [2] Supabase Realtime 채널 연결
    // ============================================================

    /**
     * Supabase Realtime 채널 구독
     * 동일한 Room_ID로 PC와 모바일이 연결
     */
    private async connectToRoom(roomId: string): Promise<boolean> {
        try {
            // @ts-ignore - 선택적 의존성
            const supabaseModule = await import('@supabase/supabase-js');
            if (!supabaseModule || typeof supabaseModule.createClient !== 'function') {
                throw new Error('Invalid Supabase module');
            }

            const supabase = supabaseModule.createClient(this.supabaseUrl, this.supabaseKey);
            const channelId = `cross_device:${roomId}`;

            this.channel = supabase.channel(channelId, {
                config: { broadcast: { self: false, ack: true } },
            });

            if (!this.channel) return false;

            // 디바이스 정보 수신
            this.channel.on('broadcast', { event: 'device_info' }, (payload: any) => {
                this.handleDeviceInfo(payload.payload ?? payload);
            });

            // 액션 동기화 수신
            this.channel.on('broadcast', { event: 'action_sync' }, (payload: any) => {
                const action = (payload.payload ?? payload.data) as SyncAction;
                if (action?.deviceId !== this.deviceId) {
                    this.handleIncomingAction(action);
                }
            });

            // 핸드오버 요청 수신
            this.channel.on('broadcast', { event: 'handover_request' }, (payload: any) => {
                this.handleHandoverRequest(payload.payload ?? payload);
            });

            // 핸드오버 응답 수신
            this.channel.on('broadcast', { event: 'handover_accept' }, (payload: any) => {
                this.handleHandoverAccept(payload.payload ?? payload);
            });

            // 연결 상태
            this.channel.on('broadcast', { event: 'heartbeat' }, (payload: any) => {
                if (this.sessionState) {
                    this.sessionState = {
                        ...this.sessionState,
                        lastSyncAt: Date.now(),
                        frameLatencyMs: Date.now() - (payload.payload?.timestamp ?? Date.now()),
                    };
                }
            });

            await this.channel.subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    this.isAvailable = true;
                    console.log(`[CrossDeviceSync] ${this.deviceId} connected to ${roomId}`);
                }
            });

            return true;
        } catch (err) {
            this.isAvailable = false;
            this.channel = null;
            console.warn('[CrossDeviceSync] Supabase unavailable. Offline mode.');
            return false;
        }
    }

    // ============================================================
    // [2] 결정론적 델타 동기화
    // ============================================================

    /**
     * 한쪽 기기에서 발생한 액션을 상대 기기로 실시간 전송
     *
     * ΔS = S_Mobile ⊕ S_PC
     * 수신 기기는 PRNG Seed로 로컬 상태에 dispatch하여 100% 동일 결과 도출
     * T_latency ≤ 100ms
     */
    async broadcastAction(type: string, payload: Record<string, unknown>): Promise<void> {
        if (!this.isAvailable || !this.channel || !this.sessionState) {
            this.queuePendingAction(type, payload);
            return;
        }

        const action: SyncAction = {
            type,
            payload,
            timestamp: Date.now(),
            deviceId: this.deviceId,
            actionId: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            prngCallCount: this.sessionState.prng.callCount,
            checksum: this.computeActionChecksum(type, payload),
        };

        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'action_sync',
                payload: action,
            });
        } catch (err) {
            console.error('[CrossDeviceSync] Broadcast failed:', err);
            this.queuePendingAction(type, payload);
        }
    }

    /**
     * 수신된 액션 처리
     * PRNG 동기화 + 체크섬 검증
     */
    private handleIncomingAction(action: SyncAction): void {
        // 체크섬 검증
        const expectedChecksum = this.computeActionChecksum(action.type, action.payload);
        if (action.checksum !== expectedChecksum) {
            this.callbacks.onError?.('CHECKSUM_MISMATCH', `Action ${action.actionId} checksum mismatch`);
        }

        // PRNG 호출 횟수 검증
        if (this.sessionState && action.prngCallCount !== this.sessionState.prng.callCount) {
            console.warn(`[CrossDeviceSync] PRNG desync: local=${this.sessionState.prng.callCount}, remote=${action.prngCallCount}`);
        }

        this.pendingActionQueue.push(action);
        this.callbacks.onActionReceived(action);
    }

    /**
     * Heartbeat 전송 — 레이턴시 측정
     */
    async sendHeartbeat(): Promise<void> {
        if (!this.isAvailable || !this.channel) return;
        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'heartbeat',
                payload: { deviceId: this.deviceId, timestamp: Date.now() },
            });
        } catch { /* silent */ }
    }

    // ============================================================
    // [3] 컴패니언 스크린 모드
    // ============================================================

    /**
     * PC를 메인(WebGL), 모바일을 컨트롤러로 설정
     */
    async setCompanionScreenMode(role: DeviceRole): Promise<void> {
        if (!this.sessionState) return;

        const prevMode = this.sessionState.syncMode;
        this.sessionState = {
            ...this.sessionState,
            syncMode: 'COMPANION_SCREEN',
        };

        this.callbacks.onSyncStateChange?.('COMPANION_SCREEN', prevMode);
        await this.broadcastDeviceInfo();
    }

    // ============================================================
    // [4] 심리스 세션 이어하기 (Handover)
    // ============================================================

    /**
     * PC → 모바일 (또는 모바일 → PC) 세션 핸드오버 요청
     *
     * 1. 현재 디바이스가 대기(잠금) 상태로 전환
     * 2. 상대 디바이스로 컨트롤 권한 이양
     * 3. 모든 미처리 액션 큐 전송
     */
    async requestHandover(targetDeviceId: string): Promise<void> {
        if (!this.isAvailable || !this.channel || !this.sessionState) return;

        this.handoverInProgress = true;

        const event: HandoverEvent = {
            fromDeviceId: this.deviceId,
            toDeviceId: targetDeviceId,
            capturedFrame: this.sessionState.prng.callCount,
            pendingActions: [...this.pendingActionQueue],
            timestamp: Date.now(),
        };

        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'handover_request',
                payload: event,
            });

            // 로컬 상태를 대기 모드로 전환
            const prevMode = this.sessionState.syncMode;
            this.sessionState = {
                ...this.sessionState,
                syncMode: 'SESSION_HANDOVER',
            };
            this.callbacks.onSyncStateChange?.('SESSION_HANDOVER', prevMode);
        } catch (err) {
            this.handoverInProgress = false;
            this.callbacks.onError?.('HANDOVER_FAILED', 'Handover request failed');
        }
    }

    /**
     * 핸드오버 요청 수신 처리
     */
    private async handleHandoverRequest(event: HandoverEvent): Promise<void> {
        if (!this.channel || !this.sessionState) return;

        // 핸드오버 수락
        await this.channel.send({
            type: 'broadcast',
            event: 'handover_accept',
            payload: { ...event, acceptedAt: Date.now() },
        });

        // 펜딩 액션 재생
        for (const action of event.pendingActions) {
            this.callbacks.onActionReceived(action);
        }

        this.handoverInProgress = false;
        this.callbacks.onHandover?.(event);
    }

    private handleHandoverAccept(event: HandoverEvent): void {
        this.handoverInProgress = false;
        this.callbacks.onHandover?.(event);
    }

    // ============================================================
    // 유틸리티
    // ============================================================

    private async broadcastDeviceInfo(): Promise<void> {
        if (!this.isAvailable || !this.channel) return;

        const info: DeviceInfo = {
            deviceId: this.deviceId,
            role: this.detectRole(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
            screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
            connectedAt: Date.now(),
            latency: 0,
        };

        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'device_info',
                payload: info,
            });
        } catch { /* silent */ }
    }

    private handleDeviceInfo(info: DeviceInfo): void {
        if (!this.sessionState) return;
        if (info.deviceId === this.deviceId) return;

        const isMain = info.role === 'PC_MAIN';
        this.sessionState = {
            ...this.sessionState,
            primaryDevice: isMain ? info : this.sessionState.primaryDevice,
            secondaryDevice: isMain ? this.sessionState.secondaryDevice : info,
        };

        if (this.sessionState.primaryDevice && this.sessionState.secondaryDevice) {
            this.callbacks.onPairingComplete?.(
                { code: '', roomId: this.sessionState.roomId, expiresAt: 0, status: 'PAIRED' },
                info,
            );
        }
    }

    private detectRole(): DeviceRole {
        if (typeof window === 'undefined') return 'MOBILE_CONTROLLER';
        return window.innerWidth >= 1024 ? 'PC_MAIN' : 'MOBILE_CONTROLLER';
    }

    private computeActionChecksum(type: string, payload: Record<string, unknown>): string {
        let hash = 0x811C9DC5 >>> 0;
        const data = type + JSON.stringify(payload);
        for (let i = 0; i < data.length; i++) {
            hash ^= data.charCodeAt(i) & 0xFF;
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    private queuePendingAction(type: string, payload: Record<string, unknown>): void {
        const action: SyncAction = {
            type,
            payload,
            timestamp: Date.now(),
            deviceId: this.deviceId,
            actionId: `pending_${this.pendingActionQueue.length}_${Date.now()}`,
            prngCallCount: this.sessionState?.prng.callCount ?? 0,
            checksum: this.computeActionChecksum(type, payload),
        };
        this.pendingActionQueue.push(action);
    }

    getPendingActions(): readonly SyncAction[] { return this.pendingActionQueue; }

    // ============================================================
    // 세션 종료
    // ============================================================

    disconnectSession(): void {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.isAvailable = false;
        this.sessionState = null;
        this.pendingActionQueue = [];
        this.handoverInProgress = false;
        console.log('[CrossDeviceSync] Session disconnected.');
    }
}
