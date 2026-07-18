/**
 * [D31] 수묵화 스타일 셰이더 — Ink Wash Painting Shader
 *
 * InkWashShader:
 *   1. Sobel 에지 검출 → 먹선 강조
 *   2. 색상 채도 감소 (saturation × 0.4)
 *   3. 명암비 증가 (contrast × 1.5)
 *   4. 에지 영역 검정 먹선 오버레이
 *   5. 종이 질감 노이즈 오버레이
 */

import type { Season, Weather } from './types';

export interface InkWashStyle {
    readonly inkIntensity: number;
    readonly brushStrokeWidth: number;
    readonly paperTextureStrength: number;
    readonly colorSaturation: number;
    readonly edgeDarkening: number;
    readonly contrast: number;
}

const SEASON_STYLES: Record<Season, InkWashStyle> = {
    SPRING: { inkIntensity: 0.3, brushStrokeWidth: 1, paperTextureStrength: 0.05, colorSaturation: 0.5, edgeDarkening: 0.3, contrast: 1.3 },
    SUMMER: { inkIntensity: 0.5, brushStrokeWidth: 2, paperTextureStrength: 0.05, colorSaturation: 0.6, edgeDarkening: 0.5, contrast: 1.4 },
    AUTUMN: { inkIntensity: 0.4, brushStrokeWidth: 2, paperTextureStrength: 0.05, colorSaturation: 0.5, edgeDarkening: 0.4, contrast: 1.3 },
    WINTER: { inkIntensity: 0.3, brushStrokeWidth: 1, paperTextureStrength: 0.08, colorSaturation: 0.3, edgeDarkening: 0.3, contrast: 1.2 },
};

const WEATHER_ADJUSTMENT: Record<Weather, Partial<InkWashStyle>> = {
    SUNNY: { inkIntensity: 0.3, contrast: 1.5 },
    CLOUDY: { inkIntensity: 0.4, contrast: 1.3 },
    RAIN: { inkIntensity: 0.6, contrast: 1.1, colorSaturation: 0.3 },
    SNOW: { inkIntensity: 0.2, contrast: 1.6, colorSaturation: 0.4 },
    STORM: { inkIntensity: 0.7, contrast: 0.9, colorSaturation: 0.2 },
    FOG: { inkIntensity: 0.5, contrast: 0.8, colorSaturation: 0.3 },
};

export class InkWashShader {
    /** 계절/날씨 기반 스타일 프리셋 */
    getInkWashStyle(season: Season, weather: Weather): InkWashStyle {
        const base = { ...SEASON_STYLES[season] };
        const weatherAdj = WEATHER_ADJUSTMENT[weather];

        return {
            inkIntensity: weatherAdj.inkIntensity ?? base.inkIntensity,
            brushStrokeWidth: base.brushStrokeWidth,
            paperTextureStrength: base.paperTextureStrength,
            colorSaturation: weatherAdj.colorSaturation ?? base.colorSaturation,
            edgeDarkening: base.edgeDarkening,
            contrast: weatherAdj.contrast ?? base.contrast,
        };
    }

    /** Sobel 에지 검출 (간략) */
    private detectEdges(imageData: ImageData): ImageData {
        const { width, height, data } = imageData;
        const output = new Uint8ClampedArray(data.length);
        const gray = new Float32Array(width * height);

        // Grayscale
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        }

        // Sobel
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const gx = -gray[idx - width - 1] + gray[idx - width + 1]
                         - 2 * gray[idx - 1] + 2 * gray[idx + 1]
                         - gray[idx + width - 1] + gray[idx + width + 1];
                const gy = -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1]
                         + gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];
                const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                const oIdx = idx * 4;
                output[oIdx] = mag;
                output[oIdx + 1] = mag;
                output[oIdx + 2] = mag;
                output[oIdx + 3] = 255;
            }
        }

        return new ImageData(output, width, height);
    }

    /** 캔버스 2D에 수묵화 효과 적용 */
    applyInkWash(ctx: CanvasRenderingContext2D, width: number, height: number, style: InkWashStyle): void {
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;

        // 1. 채도 감소
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray + (data[i] - gray) * style.colorSaturation;
            data[i + 1] = gray + (data[i + 1] - gray) * style.colorSaturation;
            data[i + 2] = gray + (data[i + 2] - gray) * style.colorSaturation;
        }

        // 2. 명암비 증가
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * style.contrast + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * style.contrast + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * style.contrast + 128));
        }

        ctx.putImageData(imageData, 0, 0);

        // 3. 먹선 오버레이 (에지 검출 기반)
        const edgeData = this.detectEdges(ctx.getImageData(0, 0, width, height));
        const edgeCanvas = document.createElement('canvas');
        edgeCanvas.width = width;
        edgeCanvas.height = height;
        const edgeCtx = edgeCanvas.getContext('2d')!;
        edgeCtx.putImageData(edgeData, 0, 0);

        ctx.globalAlpha = style.inkIntensity * 0.5;
        ctx.drawImage(edgeCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // 4. 종이 질감 노이즈
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = width;
        noiseCanvas.height = height;
        const noiseCtx = noiseCanvas.getContext('2d')!;
        const noiseData = noiseCtx.createImageData(width, height);
        for (let i = 0; i < noiseData.data.length; i += 4) {
            const n = Math.random() * 255;
            noiseData.data[i] = n;
            noiseData.data[i + 1] = n;
            noiseData.data[i + 2] = n;
            noiseData.data[i + 3] = Math.random() * style.paperTextureStrength * 255;
        }
        noiseCtx.putImageData(noiseData, 0, 0);
        ctx.drawImage(noiseCanvas, 0, 0);
    }

    /** CSS 필터 기반 수묵화 효과 (WebGL 대체) */
    getCSSFilter(style: InkWashStyle): string {
        const saturate = Math.max(0, style.colorSaturation * 100);
        const contrast = style.contrast * 100;
        return `saturate(${saturate}%) contrast(${contrast}%) brightness(90%)`;
    }
}
