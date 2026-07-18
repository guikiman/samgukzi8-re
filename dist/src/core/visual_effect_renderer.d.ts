/**
 * 삼국지 8 리메이크 — WebGL 기반 수묵화 셰이더 및 동적 스크린 트랜지션 렌더러
 * 파일: src/core/visual_effect_renderer.ts
 *
 * GPU 가속 GLSL 단편 셰이더(Fragment Shader) 기반 포스트 프로세싱 파이프라인
 *
 * [482] 동적 피사체 심도 (Depth of Field)
 * [483] 색수차(Chromatic Aberration) 타격감
 * [490] 물결(Water Ripple) 셰이더
 * [493] 타일 강조(Highlight) 박동(Pulse) 애니메이션
 * [496] 화면 전환 잉크 번짐(Ink Bleed) 트랜지션
 */
/**
 * Ink Bleed Transition Shader (잉크 번짐 화면 전환)
 *
 * 수학적 원리:
 * 1. 입력 텍스처(u_image)와 노이즈 텍스처(u_noise)를 샘플링
 * 2. Perlin-like 3D 노이즈 공간에서 2D 슬라이스를 생성:
 *    noise(x, y) = fbm( (x + offsetX) * scale, (y + offsetY) * scale, progress * 3.0 )
 *    여기서 fbm은 4옥타브 Fractal Brownian Motion.
 * 3. 각 픽셀의 밝기(L) = 0.299R + 0.587G + 0.114B (ITU-R BT.601 휘도)
 * 4. Dissolve 조건:
 *    if (noise(x, y) > threshold(L, progress)) → 원본 픽셀 표시
 *    else → 먹물 색상으로 대체
 *    threshold(L, p) = L * (1 - p * 0.5) + p * 0.8
 *    : 어두운 영역(L↓)일수록 threshold 낮음 → 먼저 번짐
 *    : progress가 0→1로 갈수록 threshold 상승 → 점진적 전환
 * 5. 경계선(noise ≈ threshold) 영역은 알파 블렌딩으로 유기적 번짐 표현
 */
export declare const INK_BLEED_FRAGMENT_SHADER = "#version 300 es\nprecision highp float;\n\nuniform sampler2D u_image;\nuniform sampler2D u_noise;\nuniform float u_progress;      // 0.0 \u2192 1.0: \uC804\uD658 \uC9C4\uD589\uB3C4\nuniform vec2 u_resolution;\nuniform vec4 u_inkColor;       // \uBA39\uBB3C \uC0C9\uC0C1 (\uAE30\uBCF8: rgba(20, 20, 20, 1.0))\nuniform float u_scale;         // \uB178\uC774\uC988 \uC2A4\uCF00\uC77C (\uAE30\uBCF8: 4.0)\n\nin vec2 v_texCoord;\nout vec4 fragColor;\n\n// \u2500\u2500 \uC758\uC0AC \uB09C\uC218 \uD574\uC2DC \uD568\uC218 \u2500\u2500\n// \uC785\uB825 2D \uC88C\uD45C \u2192 [0,1) \uADE0\uB4F1 \uBD84\uD3EC \uB09C\uC218\n// GLSL \uB0B4\uC7A5 \uD568\uC218\uB97C \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uB294 \uACB0\uC815\uB860\uC801 \uD574\uC2DC\nfloat hash(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * 0.1031);\n    p3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n// \u2500\u2500 2D Value Noise (Perlin-like) \u2500\u2500\n// \uC815\uC218 \uADF8\uB9AC\uB4DC \uCF54\uB108 4\uC810\uC744 \uD574\uC2DC\uB85C \uBCF4\uAC04\uD558\uC5EC \uBD80\uB4DC\uB7EC\uC6B4 \uB178\uC774\uC988 \uC0DD\uC131\n// smoothstep(0\u21921)\uC73C\uB85C \uD050\uBE45 \uBCF4\uAC04: 3t\u00B2 - 2t\u00B3\nfloat noise(vec2 p) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n    vec2 u = f * f * (3.0 - 2.0 * f);  // Hermite smoothstep\n\n    float a = hash(i);\n    float b = hash(i + vec2(1.0, 0.0));\n    float c = hash(i + vec2(0.0, 1.0));\n    float d = hash(i + vec2(1.0, 1.0));\n\n    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);\n}\n\n// \u2500\u2500 Fractal Brownian Motion (4\uC625\uD0C0\uBE0C) \u2500\u2500\n// \uB2E4\uC911 \uC2A4\uCF00\uC77C \uB178\uC774\uC988\uB97C \uB204\uC801\uD558\uC5EC \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uBA39\uBB3C \uBC88\uC9D0 \uD328\uD134 \uC0DD\uC131\n// \uAC01 \uC625\uD0C0\uBE0C: \uC9C4\uD3ED 0.5^n, \uC8FC\uD30C\uC218 2^n\n// \u2211 (A^n \u00D7 noise(P \u00D7 2^n))\nfloat fbm(vec2 p) {\n    float value = 0.0;\n    float amplitude = 0.5;\n    float frequency = 1.0;\n    for (int i = 0; i < 4; i++) {\n        value += amplitude * noise(p * frequency);\n        amplitude *= 0.5;\n        frequency *= 2.0;\n    }\n    return value;\n}\n\nvoid main() {\n    vec2 uv = v_texCoord;\n    vec4 imageColor = texture(u_image, uv);\n\n    // \uD718\uB3C4 \uACC4\uC0B0 (ITU-R BT.601): L = 0.299R + 0.587G + 0.114B\n    float luminance = dot(imageColor.rgb, vec3(0.299, 0.587, 0.114));\n\n    // 3D FBM \uB178\uC774\uC988: 2D \uC704\uCE58 + progress\uB97C \uC138 \uBC88\uC9F8 \uCC28\uC6D0\uC73C\uB85C \uC0AC\uC6A9\n    vec2 noiseCoord = uv * u_scale + vec2(u_progress * 2.0, u_progress * 1.5);\n    float noiseVal = fbm(noiseCoord);\n\n    // \uC784\uACC4\uAC12 \uD568\uC218: \uC5B4\uB450\uC6B4 \uD53D\uC140(L\u2193) \u2192 threshold \uB0AE\uC74C \u2192 \uBA3C\uC800 \uC18C\uBA78\n    // progress\u2191 \u2192 threshold \uC0C1\uC2B9 \u2192 \uC810\uC9C4\uC801 \uC804\uD658\n    float threshold = luminance * (1.0 - u_progress * 0.5) + u_progress * 0.8;\n\n    // \uACBD\uACC4\uC120 \uC54C\uD30C: noise\uAC00 threshold \uC8FC\uBCC0 \u00B10.05 \uBC94\uC704\uC77C \uB54C 0\u21921 \uBE14\uB80C\uB529\n    float edgeWidth = 0.05;\n    float alpha = smoothstep(threshold - edgeWidth, threshold + edgeWidth, noiseVal);\n\n    // \uCD5C\uC885 \uCD9C\uB825: \uC774\uBBF8\uC9C0 \u2194 \uBA39\uBB3C \uC0C9\uC0C1 \uC54C\uD30C \uBE14\uB80C\uB529\n    vec4 ink = u_inkColor;\n    fragColor = mix(ink, imageColor, alpha);\n}\n";
/**
 * Chromatic Aberration Shader (색수차 포스트 프로세싱)
 *
 * 수학적 원리:
 * 1. RGB 각 채널을 서로 다른 오프셋으로 샘플링하여 빛의 분산(dispersion) 시뮬레이션
 * 2. R 채널 오프셋: (intensity * direction.x, intensity * direction.y)
 *    G 채널: 오프셋 없음 (중심 기준)
 *    B 채널 오프셋: (-intensity * direction.x, -intensity * direction.y)
 * 3. 방향 벡터 direction = normalize(uv - 0.5): 화면 중심에서 바깥 방향
 *    → 가장자리일수록 색수차 강함 (렌즈 물리 현상과 일치)
 * 4. intensity는 시간에 따라 지수 감쇠: I(t) = I₀ × decayFactor^t
 *    → 0.1초 내외로 빠르게 소멸
 * 5. 배럴 왜곡(Barrel Distortion) 추가: r' = r × (1 + k × r²)
 *    k > 0: 배럴 왜곡 (핀쿠션 보정)
 */
export declare const CHROMATIC_ABERRATION_FRAGMENT_SHADER = "#version 300 es\nprecision highp float;\n\nuniform sampler2D u_image;\nuniform float u_intensity;     // 0.0 ~ 1.0: \uC0C9\uC218\uCC28 \uC138\uAE30\nuniform vec2 u_resolution;\nuniform float u_barrelK;       // \uBC30\uB7F4 \uC65C\uACE1 \uACC4\uC218 (\uAE30\uBCF8: 0.02)\n\nin vec2 v_texCoord;\nout vec4 fragColor;\n\nvoid main() {\n    vec2 uv = v_texCoord;\n\n    // \uD654\uBA74 \uC911\uC2EC \uAE30\uC900 \uC815\uADDC\uD654 \uC88C\uD45C [-1, 1]\n    vec2 center = uv - 0.5;\n    float r = length(center);\n\n    // \uBC30\uB7F4 \uC65C\uACE1: r' = r \u00D7 (1 + k \u00D7 r\u00B2)\n    // r\uC774 \uD074\uC218\uB85D(\uAC00\uC7A5\uC790\uB9AC) \uC65C\uACE1 \uC99D\uAC00\n    float barrelR = r * (1.0 + u_barrelK * r * r);\n    vec2 barrelDir = r > 0.0 ? center / r : vec2(0.0);\n    vec2 barrelUV = uv;  // \uBC30\uB7F4 \uC65C\uACE1 \uC801\uC6A9 \uC548 \uD568 (\uD14D\uC2A4\uCC98 \uC720\uC9C0)\n\n    // \uBC29\uD5A5 \uBCA1\uD130: \uC911\uC2EC\uC5D0\uC11C \uBC14\uAE65 \uBC29\uD5A5 (\uC815\uADDC\uD654)\n    vec2 dir = r > 0.0 ? center / r : vec2(0.0);\n\n    // \uCC44\uB110\uBCC4 \uC624\uD504\uC14B: R = +direction, B = -direction\n    // \uD22C\uC601 \uD589\uB82C \uACE0\uB824: \uC885\uD6A1\uBE44 \uBCF4\uC815\n    float aspect = u_resolution.x / u_resolution.y;\n    vec2 offset = dir * u_intensity * 0.02 * vec2(1.0, aspect);\n    offset *= (1.0 + r * 0.5);  // \uAC00\uC7A5\uC790\uB9AC\uB85C \uAC08\uC218\uB85D \uAC15\uD654\n\n    // \uAC01 \uCC44\uB110 \uB3C5\uB9BD \uC0D8\uD50C\uB9C1\n    float rChan = texture(u_image, uv + offset).r;\n    float gChan = texture(u_image, uv).g;\n    float bChan = texture(u_image, uv - offset).b;\n\n    // \uCC44\uB110 \uD569\uC131\n    fragColor = vec4(rChan, gChan, bChan, 1.0);\n}\n";
/**
 * Water Ripple + Pulse Highlight Shader (물결 + 타일 펄스)
 *
 * 수학적 원리:
 * 1. 다중 파동 중첩(Superposition):
 *    D(x, y, t) = Σ Aᵢ × sin(ωᵢ × dist(P, Cᵢ) - phaseᵢ(t))
 *    각 파동: 중심 Cᵢ에서 동심원 형태로 퍼져나감
 *    Aᵢ: 진폭 (시간에 따라 감쇠: Aᵢ(t) = Aᵢ₀ × 0.97^t)
 *    ωᵢ: 주파수 (파동 간격)
 *    phaseᵢ(t): 위상 (시간에 따라 선형 증가)
 *
 * 2. Pulse 하이라이트:
 *    alpha(t) = 0.3 + 0.7 × (0.5 + 0.5 × sin(ω_pulse × t))
 *    타일 경계선 주변에 링 형태로 렌더링
 *
 * 3. UV 변위(Displacement):
 *    dx = ∇D · (1, 0), dy = ∇D · (0, 1)
 *    변위된 UV로 텍스처 리샘플링 → 물결에 의한 굴절 효과
 */
export declare const WATER_RIPPLE_FRAGMENT_SHADER = "#version 300 es\nprecision highp float;\n\nuniform sampler2D u_image;\nuniform sampler2D u_rippleMap;  // Ripple height map (R: height, G: phase)\nuniform float u_time;\nuniform vec2 u_resolution;\nuniform vec4 u_pulseColor;     // \uD384\uC2A4 \uD558\uC774\uB77C\uC774\uD2B8 \uC0C9\uC0C1\nuniform float u_pulseAlpha;    // \uD384\uC2A4 \uC54C\uD30C (0.3~1.0)\nuniform vec2 u_mouseHex;       // \uB9C8\uC6B0\uC2A4 \uD638\uBC84 \uD5E5\uC2A4 \uC88C\uD45C\n\nin vec2 v_texCoord;\nout vec4 fragColor;\n\nvoid main() {\n    vec2 uv = v_texCoord;\n\n    // \uB9AC\uD50C \uB9F5\uC5D0\uC11C \uB192\uC774\uC640 \uC704\uC0C1 \uC0D8\uD50C\uB9C1\n    vec4 rippleData = texture(u_rippleMap, uv);\n    float height = rippleData.r;       // \uBB3C\uACB0 \uB192\uC774\n    float phase = rippleData.g;        // \uC704\uC0C1\n\n    // UV \uBCC0\uC704 (\uAD74\uC808 \uD6A8\uACFC): height \uAE30\uBC18 \uC218\uD3C9/\uC218\uC9C1 \uC2DC\uD504\uD2B8\n    // \uAD74\uC808\uB960 1.33 (\uBB3C) \uC2DC\uBBAC\uB808\uC774\uC158: sin(\uC785\uC0AC\uAC01) / sin(\uAD74\uC808\uAC01) = n\n    float refractionStrength = 0.02;\n    vec2 displacedUv = uv + vec2(\n        height * sin(phase) * refractionStrength,\n        height * cos(phase * 1.3) * refractionStrength\n    );\n\n    // \uBCC0\uC704\uB41C UV\uB85C \uC774\uBBF8\uC9C0 \uC0D8\uD50C\uB9C1\n    vec4 color = texture(u_image, displacedUv);\n\n    // \uD384\uC2A4 \uD558\uC774\uB77C\uC774\uD2B8 \uC624\uBC84\uB808\uC774\n    // \uD0C0\uC77C \uACBD\uACC4\uC120 \uAC10\uC9C0 (uv \uAE30\uBC18 \uBAA8\uC758 hex grid)\n    vec2 hexSize = 1.0 / vec2(12.0, 8.0);  // 12\u00D78 \uD5E5\uC2A4 \uADF8\uB9AC\uB4DC \uAC00\uC815\n    vec2 hexUV = fract(uv / hexSize) - 0.5;\n    float hexDist = length(hexUV);\n\n    // \uD5E5\uC2A4 \uACBD\uACC4\uC120 (hex radial distance \u2248 0.5\uC5D0\uC11C \uACBD\uACC4)\n    float edge = 1.0 - smoothstep(0.35, 0.5, hexDist);\n\n    // \uD384\uC2A4 \uC54C\uD30C\uC640 \uACBD\uACC4\uC120 \uACF1\n    float pulse = edge * u_pulseAlpha * 0.5;\n\n    // \uCD5C\uC885 \uC0C9\uC0C1: \uC6D0\uBCF8 \uC774\uBBF8\uC9C0 + \uD384\uC2A4 \uD558\uC774\uB77C\uC774\uD2B8 \uC624\uBC84\uB808\uC774\n    vec3 finalColor = color.rgb + u_pulseColor.rgb * pulse;\n\n    fragColor = vec4(finalColor, color.a);\n}\n";
/**
 * 전체 화면 사각형 정점 셰이더 (공용)
 * 2개의 삼각형으로 화면 전체를 덮는 단순 패스스루
 */
export declare const FULLSCREEN_VERTEX_SHADER = "#version 300 es\nprecision highp float;\n\nin vec2 a_position;\nin vec2 a_texCoord;\n\nout vec2 v_texCoord;\n\nvoid main() {\n    gl_Position = vec4(a_position, 0.0, 1.0);\n    v_texCoord = a_texCoord;\n}\n";
export type ShaderEffect = "inkBleed" | "chromaticAberration" | "waterRipple";
export interface ShaderUniforms {
    readonly u_progress?: number;
    readonly u_intensity?: number;
    readonly u_time?: number;
    readonly u_pulseAlpha?: number;
    readonly u_inkColor?: readonly [number, number, number, number];
    [key: string]: number | readonly number[] | undefined;
}
export declare class WebGLShaderManager {
    private gl;
    private programs;
    private readonly vertexShader;
    private quadVAO;
    private quadVBO;
    private texCoordVBO;
    private noiseTexture;
    private rippleTexture;
    private frameBuffer;
    private renderTexture;
    private width;
    private height;
    private initialized;
    constructor();
    initialize(canvas: HTMLCanvasElement): boolean;
    get isInitialized(): boolean;
    private compileShaderSource;
    private compileProgram;
    private initQuadGeometry;
    private createNoiseTexture;
    private createRippleTexture;
    private initFramebuffer;
    updateRippleTexture(ripples: readonly {
        x: number;
        y: number;
        amplitude: number;
        phase: number;
    }[]): void;
    renderEffect(effect: ShaderEffect, sourceTexture: WebGLTexture | null, uniforms: ShaderUniforms): void;
    private setUniforms;
    dispose(): void;
    resize(width: number, height: number): void;
}
export type EffectCommand = {
    readonly type: "inkBleed";
    readonly progress: number;
    readonly inkColor?: readonly [number, number, number, number];
} | {
    readonly type: "chromaticAberration";
    readonly intensity: number;
} | {
    readonly type: "waterRipple";
    readonly time: number;
    readonly pulseAlpha: number;
    readonly ripples: readonly {
        x: number;
        y: number;
        amplitude: number;
        phase: number;
    }[];
};
export declare class VisualEffectRenderer {
    private readonly shaderManager;
    private canvas;
    private srcCanvas;
    private srcCtx;
    private srcTexture;
    private effectQueue;
    private isProcessing;
    private readonly decayFactor;
    private readonly minIntensity;
    constructor();
    /**
     * @param canvas - WebGL 렌더링 대상 캔버스
     * @param sourceCanvas - 게임 렌더링 소스 캔버스 (Canvas 2D)
     */
    initialize(canvas: HTMLCanvasElement, sourceCanvas: HTMLCanvasElement): boolean;
    get isReady(): boolean;
    enqueueTransitionInkBleed(durationMs?: number): void;
    triggerChromaticAberration(intensity?: number): void;
    triggerWaterRipple(ripplePoints: readonly {
        x: number;
        y: number;
        amplitude: number;
    }[]): void;
    update(dt: number): void;
    private copySourceToTexture;
    private get gl();
    dispose(): void;
}
//# sourceMappingURL=visual_effect_renderer.d.ts.map