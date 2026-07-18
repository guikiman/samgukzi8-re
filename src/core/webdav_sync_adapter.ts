/**
 * [E32] 자동 백업 클라우드 동기화 브릿지 — WebDAVSyncAdapter
 *
 * 목적: 로컬 브라우저 세이브 슬롯 데이터를 유저 개인의 클라우드
 *       (WebDAV, Google Drive API)로 스케줄 업로드.
 *
 * 핵심 로직:
 *   1. 세이브 시간 정보 대조 → 충돌 해소 UI
 *   2. 원격 파일이 최신이면 '덮어쓸지/원격 버전 받을지' 선택
 */

export type SyncStatus = 'IDLE' | 'UPLOADING' | 'DOWNLOADING' | 'SUCCESS' | 'CONFLICT' | 'ERROR';
export type ConflictResolution = 'LOCAL_WINS' | 'REMOTE_WINS' | 'SKIP';

export interface SyncEntry {
    readonly slotId: string;
    readonly label: string;
    readonly localTimestamp: number;
    readonly remoteTimestamp: number;
    readonly localChecksum: string;
    readonly remoteChecksum: string;
}

export interface SyncResult {
    readonly status: SyncStatus;
    readonly entry: SyncEntry;
    readonly resolution?: ConflictResolution;
    readonly errorMessage?: string;
}

export class WebDAVSyncAdapter {
    private syncInterval: number | null = null;
    private readonly DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5분

    /**
     * 원격 세이브와 로컬 세이브 충돌 감지
     */
    detectConflict(localEntry: SyncEntry, remoteEntry: SyncEntry): boolean {
        if (localEntry.localChecksum !== remoteEntry.remoteChecksum) {
            return true;
        }
        // 타임스탬프 차이가 1초 이상이면 충돌
        return Math.abs(localEntry.localTimestamp - remoteEntry.remoteTimestamp) > 1000;
    }

    /**
     * 충돌 해소: 선택한 전략에 따라 최종 데이터 결정
     */
    resolveConflict(
        localData: string,
        remoteData: string,
        resolution: ConflictResolution,
    ): { data: string; timestamp: number } {
        switch (resolution) {
            case 'LOCAL_WINS':
                return { data: localData, timestamp: Date.now() };
            case 'REMOTE_WINS':
                return { data: remoteData, timestamp: Date.now() };
            case 'SKIP':
                return { data: localData, timestamp: 0 };
        }
    }

    /** 정기 동기화 시작 */
    startAutoSync(callback: () => Promise<void>): void {
        if (this.syncInterval) return;
        this.syncInterval = window.setInterval(callback, this.DEFAULT_INTERVAL_MS);
    }

    /** 자동 동기화 중지 */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * WebDAV PUT 요청 (자리표시)
     * 실제 구현 시 fetch()로 WebDAV 서버와 통신
     */
    async uploadToWebDAV(url: string, data: string, authToken: string): Promise<boolean> {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: data,
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * WebDAV GET 요청 (자리표시)
     */
    async downloadFromWebDAV(url: string, authToken: string): Promise<string | null> {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (!response.ok) return null;
            return await response.text();
        } catch {
            return null;
        }
    }
}
