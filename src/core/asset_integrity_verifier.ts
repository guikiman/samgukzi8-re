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

export class AssetIntegrityVerifier {
    private manifest: Map<string, AssetManifestEntry> = new Map();

    /** 매니페스트 로드 */
    loadManifest(entries: AssetManifestEntry[]): void {
        for (const entry of entries) {
            this.manifest.set(entry.path, entry);
        }
    }

    /** 에셋 무결성 검증 */
    async verify(path: string, data: ArrayBuffer): Promise<boolean> {
        const entry = this.manifest.get(path);
        if (!entry) return true; // 매니페스트에 없으면 검증 스킵

        const hash = await this.computeSHA256(data);
        return hash === entry.sha256 && data.byteLength === entry.size;
    }

    /** SHA-256 해시 계산 */
    async computeSHA256(data: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /** 매니페스트에 에셋 추가 */
    addToManifest(entry: AssetManifestEntry): void {
        this.manifest.set(entry.path, entry);
    }

    /** 매니페스트에서 에셋 제거 */
    removeFromManifest(path: string): void {
        this.manifest.delete(path);
    }

    /** 매니페스트 전체 조회 */
    getManifest(): AssetManifestEntry[] {
        return Array.from(this.manifest.values());
    }
}
