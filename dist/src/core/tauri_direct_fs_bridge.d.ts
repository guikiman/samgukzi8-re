/**
 * [E35] 데스크톱 파일 입출력 다이렉트 브릿지 — TauriDirectFileSystemBridge
 *
 * 목적: 웹 브라우저 로컬 스토리지 5MB 임계치 회피를 위해
 *       Tauri 데스크톱 환경에서 OS 파일로 정적 세이브 저장.
 *
 * 핵심 로직:
 *   1. window.__TAURI__ 탐지 시 fs.writeTextFile/readTextFile로 브릿지
 *   2. 일반 브라우저는 IndexedDB 폴백
 */
export type StorageBackend = 'TAURI_FS' | 'INDEXED_DB' | 'LOCAL_STORAGE';
export interface TauriFsResult {
    readonly success: boolean;
    readonly data?: string;
    readonly error?: string;
    readonly backend: StorageBackend;
}
export declare class TauriDirectFileSystemBridge {
    private readonly SAVE_DIR;
    /**
     * 현재 환경에 맞는 스토리지 백엔드 감지
     */
    detectBackend(): StorageBackend;
    /** Tauri 여부 */
    get isTauriDesktop(): boolean;
    /**
     * 파일 저장
     */
    saveFile(fileName: string, data: string): Promise<TauriFsResult>;
    /**
     * 파일 읽기
     */
    loadFile(fileName: string): Promise<TauriFsResult>;
    /** Tauri writeTextFile 래퍼 (런타임에 동적 import) */
    private tauriWriteFile;
    /** Tauri readTextFile 래퍼 */
    private tauriReadFile;
}
//# sourceMappingURL=tauri_direct_fs_bridge.d.ts.map