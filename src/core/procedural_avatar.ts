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

export class ProceduralAvatarGenerator {
    private static readonly FACE_COLORS = ['#f5d0a9', '#e8c39e', '#d4a574', '#c4956a', '#b8845a', '#a07050'];
    private static readonly HAT_COLORS = ['#8b0000', '#2f4f4f', '#4a3728', '#191970', '#556b2f', '#8b4513'];
    private static readonly CLOTHES_COLORS = ['#2e4057', '#6b2d5c', '#1a5b3a', '#8b4513', '#4a6741', '#5c4033', '#2c3e50'];
    private static readonly EYE_STYLES = [
        '<circle cx="24" cy="26" r="3" fill="#333"/><circle cx="40" cy="26" r="3" fill="#333"/>',
        '<ellipse cx="24" cy="26" rx="3" ry="4" fill="#333"/><ellipse cx="40" cy="26" rx="3" ry="4" fill="#333"/>',
        '<circle cx="24" cy="26" r="2" fill="#333"/><circle cx="40" cy="26" r="2" fill="#333"/>',
        '<path d="M22 26 Q24 24 26 26" stroke="#333" fill="none"/><path d="M38 26 Q40 24 42 26" stroke="#333" fill="none"/>',
        '<circle cx="24" cy="26" r="3" fill="#222"/><circle cx="40" cy="26" r="3" fill="#222"/><circle cx="24" cy="25" r="1" fill="#fff"/><circle cx="40" cy="25" r="1" fill="#fff"/>',
        '<ellipse cx="24" cy="26" rx="2" ry="3" fill="#333"/><ellipse cx="40" cy="26" rx="2" ry="3" fill="#333"/>',
    ];
    private static readonly MOUTH_STYLES = [
        '<path d="M26 34 Q32 38 38 34" stroke="#333" fill="none" stroke-width="1.5"/>',
        '<path d="M26 36 Q32 32 38 36" stroke="#333" fill="none" stroke-width="1.5"/>',
        '<ellipse cx="32" cy="35" rx="4" ry="2" fill="#333"/>',
        '<path d="M28 34 L36 34" stroke="#333" stroke-width="1.5"/>',
    ];
    private static readonly BEARD_STYLES = [
        '',
        '<path d="M26 34 Q32 44 38 34" fill="#555" opacity="0.6"/>',
        '<ellipse cx="32" cy="38" rx="6" ry="4" fill="#666" opacity="0.5"/>',
        '<path d="M24 34 L28 44 L36 44 L40 34" fill="#777" opacity="0.4"/>',
        '<circle cx="32" cy="36" r="3" fill="#555" opacity="0.5"/>',
    ];
    private static readonly HAT_STYLES = [
        '',
        'HAT_RECT',
        'HAT_TRIANGLE',
        'HAT_SQUARE',
        'HAT_OVAL',
        'HAT_STAR',
    ];

    generateDNA(seed: number): AvatarDNA {
        const rng = this.seededRandom(seed);
        return {
            seed,
            faceShape: Math.floor(rng() * 6),
            hat: Math.floor(rng() * 6),
            beard: Math.floor(rng() * 5),
            clothes: Math.floor(rng() * 7),
            eyes: Math.floor(rng() * ProceduralAvatarGenerator.EYE_STYLES.length),
            mouth: Math.floor(rng() * ProceduralAvatarGenerator.MOUTH_STYLES.length),
        };
    }

    renderSVG(dna: AvatarDNA): string {
        const faceColor = ProceduralAvatarGenerator.FACE_COLORS[dna.faceShape % ProceduralAvatarGenerator.FACE_COLORS.length];
        const hatColor = ProceduralAvatarGenerator.HAT_COLORS[dna.hat % ProceduralAvatarGenerator.HAT_COLORS.length];
        const clothesColor = ProceduralAvatarGenerator.CLOTHES_COLORS[dna.clothes % ProceduralAvatarGenerator.CLOTHES_COLORS.length];

        const hatSvg = this.buildHatSvg(dna.hat, hatColor);
        const beardSvg = dna.beard > 0 ? ProceduralAvatarGenerator.BEARD_STYLES[dna.beard % ProceduralAvatarGenerator.BEARD_STYLES.length] : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="64" height="80">
  <rect x="12" y="44" width="40" height="36" rx="4" fill="${clothesColor}" />
  <ellipse cx="32" cy="28" rx="16" ry="18" fill="${faceColor}" />
  ${ProceduralAvatarGenerator.EYE_STYLES[dna.eyes % ProceduralAvatarGenerator.EYE_STYLES.length]}
  ${ProceduralAvatarGenerator.MOUTH_STYLES[dna.mouth % ProceduralAvatarGenerator.MOUTH_STYLES.length]}
  ${beardSvg}
  ${hatSvg}
</svg>`;
    }

    private buildHatSvg(hatIdx: number, color: string): string {
        switch (ProceduralAvatarGenerator.HAT_STYLES[hatIdx % ProceduralAvatarGenerator.HAT_STYLES.length]) {
            case 'HAT_RECT': return `<rect x="20" y="8" width="24" height="10" rx="3" fill="${color}"/>`;
            case 'HAT_TRIANGLE': return `<path d="M16 18 L32 4 L48 18" fill="${color}"/>`;
            case 'HAT_SQUARE': return `<rect x="22" y="6" width="20" height="14" rx="2" fill="${color}"/>`;
            case 'HAT_OVAL': return `<ellipse cx="32" cy="12" rx="14" ry="6" fill="${color}"/>`;
            case 'HAT_STAR': return `<path d="M18 18 L32 4 L46 18" fill="${color}"/><circle cx="32" cy="10" r="3" fill="#ffd700"/>`;
            default: return '';
        }
    }

    private seededRandom(seed: number): () => number {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }
}
