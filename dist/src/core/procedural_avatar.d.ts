/**
 * [5] 절차적 조합형 NPC 아바타 생성기 (Procedural Avatar Generator)
 *
 * Canvas/SVG 상에서 모자, 수염, 옷, 얼굴 셰이프를 이진 랜덤 Seed 기반으로
 * 무작위 실시간 합성 렌더링하는 초경량 SVG 아바타 제너레이터
 *
 * AvatarDNA: seed -> faceShape(0-7) | hat(0-5) | beard(0-4) | clothes(0-6) | eyes(0-5) | mouth(0-3)
 */
export interface AvatarDNA {
    readonly seed: number;
    readonly faceShape: number;
    readonly hat: number;
    readonly beard: number;
    readonly clothes: number;
    readonly eyes: number;
    readonly mouth: number;
}
export declare class ProceduralAvatarGenerator {
    private static readonly FACE_COLORS;
    private static readonly HAT_COLORS;
    private static readonly CLOTHES_COLORS;
    private static readonly EYE_STYLES;
    private static readonly MOUTH_STYLES;
    private static readonly BEARD_STYLES;
    private static readonly HAT_STYLES;
    generateDNA(seed: number): AvatarDNA;
    renderSVG(dna: AvatarDNA): string;
    private buildHatSvg;
    private seededRandom;
}
//# sourceMappingURL=procedural_avatar.d.ts.map