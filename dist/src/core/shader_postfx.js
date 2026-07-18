/**
 * [4] 전장의 안개 가우시안 블러 및 섀도우 맵 결합 셰이더
 * [5] 3D 헥사곤 타일 전용 실시간 SSAO
 * [7] 전법 크리티컬 색수차(Chromatic Aberration) 포스트 이펙트
 * [9] 연소 타일 전용 소프트 파티클 셰이더
 * [10] 공성 데미지 연동 성벽 메시 크랙 변조 셰이더
 *
 * 모든 셰이더는 GLSL 300 es 소스 코드를 TypeScript 템플릿 문자열로 내장.
 * WebGL2 렌더러에서 런타임 컴파일 및 바인딩.
 */
// ============================================================
// [4] 가우시안 블러 + 섀도우 맵 결합 셰이더
// ============================================================
export const SHADER_FOG_BLUR = `#version 300 es
precision highp float;

uniform sampler2D uSceneTex;
uniform sampler2D uDepthTex;
uniform sampler2D uShadowTex;
uniform vec2 uTexelSize;
uniform float uBlurRadius;
uniform float uFogIntensity;

in vec2 vUv;
out vec4 fragColor;

// 7-tap 가우시안 블러 가중치
const float WEIGHTS[7] = float[](
    0.006, 0.061, 0.242, 0.383, 0.242, 0.061, 0.006
);

void main() {
    vec4 color = vec4(0.0);
    vec4 scene = texture(uSceneTex, vUv);
    float depth = texture(uDepthTex, vUv).r;

    // 2단계 가우시안 7탭 블러
    for (int i = -3; i <= 3; i++) {
        vec2 offset = vec2(float(i) * uTexelSize.x * uBlurRadius, 0.0);
        color += texture(uSceneTex, vUv + offset) * WEIGHTS[i + 3];
    }

    // 그림자(Shadow Map) 곱셈 연산
    float shadow = texture(uShadowTex, vUv).r;
    color.rgb *= mix(1.0, 0.5, shadow * (1.0 - depth));

    // Fog = blur + depth 기반 안개 농도
    vec3 fogColor = vec3(0.85, 0.82, 0.78); // 수묵화 안개색
    float fogFactor = exp(-depth * uFogIntensity);
    fragColor = vec4(mix(fogColor, color.rgb, fogFactor), 1.0);
}
`;
// ============================================================
// [5] SSAO — Screen Space Ambient Occlusion
// ============================================================
export const SHADER_SSAO = `#version 300 es
precision highp float;

uniform sampler2D uDepthTex;
uniform sampler2D uNormalTex;
uniform vec2 uTexelSize;
uniform float uRadius;
uniform float uPower;   // 기본 2.0
uniform int uKernelSize; // 기본 16

in vec2 vUv;
out float fragColor;

const int MAX_KERNEL = 64;
uniform vec3 uKernel[MAX_KERNEL];

vec3 getViewPos(vec2 uv) {
    float depth = texture(uDepthTex, uv).r;
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    // 투영 행렬 역변환 — 렌더러에서 uniform 전달
    return clip.xyz;
}

void main() {
    vec3 originPos = getViewPos(vUv);
    vec3 normal = texture(uNormalTex, vUv).xyz * 2.0 - 1.0;
    float occlusion = 0.0;

    for (int i = 0; i < MAX_KERNEL; i++) {
        if (i >= uKernelSize) break;
        vec3 samplePos = originPos + uKernel[i] * uRadius;
        vec4 offset = vec4(samplePos, 1.0);
        vec2 sampleUv = vUv + uKernel[i].xy * uTexelSize * uRadius;
        float sampleDepth = texture(uDepthTex, sampleUv).r;

        float rangeCheck = smoothstep(0.0, 1.0, uRadius / abs(originPos.z - sampleDepth));
        occlusion += step(sampleDepth, samplePos.z) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(uKernelSize));
    fragColor = pow(occlusion, uPower);
}
`;
// ============================================================
// [7] 색수차 Chromatic Aberration — 방사형 RGB 오프셋
// ============================================================
export const SHADER_CHROMATIC_ABERRATION = `#version 300 es
precision highp float;

uniform sampler2D uSceneTex;
uniform float uIntensity;     // 기본 0.01, 크리티컬 시 0.05
uniform float uTime;          // 흔들림 애니메이션

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    vec2 dir = normalize(center);

    float delta = uIntensity * (1.0 + 0.3 * sin(uTime * 20.0));
    float rOffset = delta * dist;
    float bOffset = -delta * dist;

    vec2 rUv = vUv + dir * rOffset;
    vec2 bUv = vUv + dir * bOffset;

    float r = texture(uSceneTex, rUv).r;
    float g = texture(uSceneTex, vUv).g;
    float b = texture(uSceneTex, bUv).b;

    fragColor = vec4(r, g, b, 1.0);
}
`;
// ============================================================
// [8] Gerstner Wave — 수면 유체 디스플레이스먼트
// ============================================================
export const SHADER_GERSTNER_WAVE = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uWindDir;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uSteepness;

in vec2 vUv;
out vec4 fragColor;

struct Wave {
    vec2 direction;
    float amplitude;
    float frequency;
    float speed;
    float steepness;
};

// 3개 지향성 사인파 합성
const int WAVE_COUNT = 3;

vec3 gerstnerWave(Wave wave, vec3 position, inout vec3 tangent, inout vec3 binormal) {
    float theta = wave.frequency * dot(wave.direction, position.xz) + wave.speed * uTime;
    float S = sin(theta);
    float C = cos(theta);
    float steep = wave.steepness / (wave.frequency * wave.amplitude * float(WAVE_COUNT));

    tangent += vec3(
        -wave.direction.x * wave.direction.x * steep * S,
        wave.direction.x * steep * C,
        -wave.direction.x * wave.direction.z * steep * S
    );
    binormal += vec3(
        -wave.direction.x * wave.direction.z * steep * S,
        wave.direction.z * steep * C,
        -wave.direction.z * wave.direction.z * steep * S
    );

    return vec3(
        wave.direction.x * wave.amplitude * C,
        wave.amplitude * S,
        wave.direction.y * wave.amplitude * C
    );
}

void main() {
    vec3 pos = vec3(vUv.x, 0.0, vUv.y);
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);

    Wave[WAVE_COUNT] waves;
    waves[0] = Wave(normalize(uWindDir), uAmplitude, uFrequency, 1.0, uSteepness);
    waves[1] = Wave(normalize(uWindDir + vec2(0.3)), uAmplitude * 0.6, uFrequency * 1.4, 1.3, uSteepness * 0.8);
    waves[2] = Wave(normalize(uWindDir - vec2(0.2)), uAmplitude * 0.4, uFrequency * 2.1, 0.7, uSteepness * 0.6);

    vec3 displacement = vec3(0.0);
    for (int i = 0; i < WAVE_COUNT; i++) {
        displacement += gerstnerWave(waves[i], pos, tangent, binormal);
    }

    pos += displacement;
    vec3 normal = normalize(cross(binormal, tangent));

    // 기본 색상 + 높이 기반 음영
    float height = pos.y * 0.5 + 0.5;
    vec3 waterColor = mix(vec3(0.2, 0.4, 0.6), vec3(0.1, 0.3, 0.5), height);
    float light = dot(normal, normalize(vec3(0.5, 1.0, 0.3)));

    fragColor = vec4(waterColor * (0.3 + 0.7 * light), 0.8);
}
`;
// ============================================================
// [9] 소프트 파티클 화염 셰이더
// ============================================================
export const SHADER_SOFT_PARTICLE = `#version 300 es
precision highp float;

uniform sampler2D uSceneDepth;   // G-Buffer 깊이
uniform sampler2D uParticleTex;
uniform vec2 uTexelSize;

in vec2 vUv;
in float vAlpha;
out vec4 fragColor;

void main() {
    vec4 particle = texture(uParticleTex, vUv);

    // 깊이 차이 Δd 계산
    float sceneDepth = texture(uSceneDepth, gl_FragCoord.xy * uTexelSize).r;
    float particleDepth = gl_FragCoord.z;
    float deltaDepth = sceneDepth - particleDepth;

    // Δd → 0에 가까울수록 알파 감쇠 (부드러운 경계)
    float softness = smoothstep(0.0, 0.02, deltaDepth);
    float alpha = particle.a * vAlpha * softness;

    // 화염 색상 (중심=흰색→노랑→빨강→투명)
    vec3 fireColor = mix(
        vec3(1.0, 0.2, 0.0),    // 빨강
        mix(vec3(1.0, 0.9, 0.3), vec3(1.0), particle.r), // 흰색+노랑
        particle.g
    );

    fragColor = vec4(fireColor, alpha);
}
`;
// ============================================================
// [10] 성벽 크랙 변조 셰이더
// ============================================================
export const SHADER_WALL_CRACK = `#version 300 es
precision highp float;

uniform sampler2D uCrackTex;     // 균열 패턴 텍스처
uniform sampler2D uNormalMap;    // 노멀 디테일 맵
uniform float uHpRatio;          // 0(파괴) ~ 1(완전)
uniform vec3 uWallColor;

in vec2 vUv;
in vec3 vNormal;
out vec4 fragColor;

void main() {
    // 체력 비례 균열 가중치
    float crackWeight = 1.0 - uHpRatio;
    float crackIntensity = pow(crackWeight, 2.0); // 기하급수적 깊이

    // 균열 패턴 샘플링
    float crack = texture(uCrackTex, vUv * 4.0).r;
    crack = smoothstep(0.5 - crackIntensity * 0.4, 0.8, crack);

    // 노멀 디테일 — 균열 깊이에 따라 그림자 변조
    vec3 normalDetail = texture(uNormalMap, vUv).rgb * 2.0 - 1.0;
    vec3 finalNormal = normalize(vNormal + normalDetail * crackIntensity * 2.0);

    // 라이팅
    float light = dot(finalNormal, normalize(vec3(0.5, 1.0, 0.3)));

    // 손상 영역은 어둡게
    vec3 damagedColor = uWallColor * (0.2 + 0.8 * (1.0 - crack * crackIntensity));
    vec3 color = mix(damagedColor, uWallColor * light, 0.6);

    // 균열 경계선 강조
    float edge = abs(crack - 0.5) * 2.0;
    color = mix(color, vec3(0.05), crack * crackIntensity * (1.0 - edge));

    fragColor = vec4(color, 1.0);
}
`;
export class PostFXManager {
    constructor() {
        this.presets = new Map();
        this.registerDefaults();
    }
    registerDefaults() {
        this.register('fog_blur', SHADER_FOG_BLUR, ['uSceneTex', 'uDepthTex', 'uShadowTex', 'uBlurRadius', 'uFogIntensity']);
        this.register('ssao', SHADER_SSAO, ['uDepthTex', 'uNormalTex', 'uRadius', 'uPower', 'uKernelSize']);
        this.register('chromatic_aberration', SHADER_CHROMATIC_ABERRATION, ['uSceneTex', 'uIntensity', 'uTime']);
        this.register('gerstner_wave', SHADER_GERSTNER_WAVE, ['uTime', 'uWindDir', 'uAmplitude', 'uFrequency', 'uSteepness']);
        this.register('soft_particle', SHADER_SOFT_PARTICLE, ['uSceneDepth', 'uParticleTex']);
        this.register('wall_crack', SHADER_WALL_CRACK, ['uCrackTex', 'uNormalMap', 'uHpRatio', 'uWallColor']);
    }
    register(id, source, uniforms) {
        this.presets.set(id, { id, source, uniforms, enabled: true, intensity: 1.0 });
    }
    getShader(id) { return this.presets.get(id); }
    enable(id, val) {
        const p = this.presets.get(id);
        if (p)
            this.presets.set(id, { ...p, enabled: val });
    }
    setIntensity(id, val) {
        const p = this.presets.get(id);
        if (p)
            this.presets.set(id, { ...p, intensity: val });
    }
}
//# sourceMappingURL=shader_postfx.js.map