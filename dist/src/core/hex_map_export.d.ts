/**
 * [Task 100] 헥스 맵 익스포트 — HexMapExport
 *
 * 목적: 현재 헥스 맵 상태를 이미지 또는 JSON 데이터로
 *       내보내기.
 *
 * 핵심 로직:
 *   1. 맵을 PNG 이미지로 캡처
 *   2. 맵 데이터를 JSON으로 직렬화
 */
export declare class HexMapExport {
    /**
     * 캔버스를 PNG Blob으로 내보내기
     */
    exportToPNG(canvas: HTMLCanvasElement, quality?: number): Promise<Blob>;
    /**
     * 캔버스를 Base64 Data URL로 내보내기
     */
    exportToDataURL(canvas: HTMLCanvasElement, format?: "png" | "jpeg", quality?: number): string;
    /**
     * 맵 데이터를 JSON으로 직렬화
     */
    exportToJSON(tiles: {
        q: number;
        r: number;
        terrain: string;
        elevation: number;
        owner?: string;
    }[]): string;
    /**
     * JSON 데이터를 다운로드 링크 생성
     */
    downloadJSON(data: string, filename?: string): void;
}
//# sourceMappingURL=hex_map_export.d.ts.map