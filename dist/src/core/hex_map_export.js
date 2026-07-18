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
export class HexMapExport {
    /**
     * 캔버스를 PNG Blob으로 내보내기
     */
    exportToPNG(canvas, quality = 0.92) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob)
                    resolve(blob);
                else
                    reject(new Error("[HexMapExport] PNG export failed"));
            }, "image/png", quality);
        });
    }
    /**
     * 캔버스를 Base64 Data URL로 내보내기
     */
    exportToDataURL(canvas, format = "png", quality = 0.92) {
        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        return canvas.toDataURL(mime, quality);
    }
    /**
     * 맵 데이터를 JSON으로 직렬화
     */
    exportToJSON(tiles) {
        return JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            tileCount: tiles.length,
            tiles,
        }, null, 2);
    }
    /**
     * JSON 데이터를 다운로드 링크 생성
     */
    downloadJSON(data, filename = "hexmap_export.json") {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
//# sourceMappingURL=hex_map_export.js.map