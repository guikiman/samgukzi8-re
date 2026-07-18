/**
 * [E53] 에셋 무결성 검증기 — AssetIntegrityVerifier
 *
 * 목적: 로드된 에셋의 SHA-256 해시 검증으로
 *       변조/손상된 파일 로드 방지.
 *
 * 핵심 로직:
 *   1. 에셋 로드 시 해시 계산
 *   2. 매니페스트 해시와 비교 검증
 */
export interface AssetManifestEntry {
    readonly path: string;
    readonly sha256: string;
    readonly size: number;
}
export declare class AssetIntegrityVerifier {
    private manifest;
    /** 매니페스트 로드 */
    loadManifest(entries: AssetManifestEntry[]): void;
    /** 에셋 무결성 검증 */
    verify(path: string, data: ArrayBuffer): Promise<boolean>;
    /** SHA-256 해시 계산 */
    computeSHA256(data: ArrayBuffer): Promise<string>;
    /** 매니페스트에 에셋 추가 */
    addToManifest(entry: AssetManifestEntry): void;
    /** 매니페스트에서 에셋 제거 */
    removeFromManifest(path: string): void;
    /** 매니페스트 전체 조회 */
    getManifest(): AssetManifestEntry[];
}
//# sourceMappingURL=asset_integrity_verifier.d.ts.map