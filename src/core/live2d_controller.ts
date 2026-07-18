/**
 * [6] Live2D 하이브리드 감정 변조 오프셋 제어기
 * [40] Live2D 립싱크 — FFT 주파수 기반 입 움직임
 *
 * Live2DEmotionController:
 *   - 텍스트 감정 태그 가중치 벡터 E = [e1,e2,e3,e4] 파싱
 *   - ParamEyeLOpen, ParamBrowLY 등 Live2D 파라미터 Slerp 보간
 *   - AnalyserNode FFT 데이터 → ParamMouthOpenY 변환
 */

export type EmotionTag = 'JOY' | 'ANGER' | 'SADNESS' | 'CALM' | 'SURPRISE';

export interface EmotionWeight {
    readonly joy: number;      // e1
    readonly anger: number;    // e2
    readonly sadness: number;  // e3
    readonly calm: number;     // e4
    readonly surprise: number; // e5
}

export interface Live2DParameter {
    readonly id: string;
    value: number;
    targetValue: number;
    readonly blendSpeed: number;
}

export class Live2DEmotionController {
    private params: Map<string, Live2DParameter> = new Map();
    private currentEmotion: EmotionWeight = { joy: 0, anger: 0, sadness: 0, calm: 0.5, surprise: 0 };
    private analyserNode: AnalyserNode | null = null;

    constructor() {
        this.registerDefaultParams();
    }

    /**
     * [6] Live2D 파라미터 맵 등록 (Cubism 4.x 호환)
     */
    private registerDefaultParams(): void {
        this.params.set('ParamEyeLOpen', { id: 'ParamEyeLOpen', value: 1, targetValue: 1, blendSpeed: 0.1 });
        this.params.set('ParamEyeROpen', { id: 'ParamEyeROpen', value: 1, targetValue: 1, blendSpeed: 0.1 });
        this.params.set('ParamBrowLY', { id: 'ParamBrowLY', value: 0, targetValue: 0, blendSpeed: 0.08 });
        this.params.set('ParamBrowRY', { id: 'ParamBrowRY', value: 0, targetValue: 0, blendSpeed: 0.08 });
        this.params.set('ParamMouthOpenY', { id: 'ParamMouthOpenY', value: 0, targetValue: 0, blendSpeed: 0.15 });
        this.params.set('ParamMouthForm', { id: 'ParamMouthForm', value: 0, targetValue: 0, blendSpeed: 0.1 });
    }

    /**
     * [6] 감정 태그 → Live2D 파라미터 오프셋
     *
     * E = [joy, anger, sadness, calm]
     * ParamEyeLOpen = 1.0 - anger * 0.5 (분노 시 눈 가늘어짐)
     * ParamBrowLY = anger * 0.5 - joy * 0.3 (분노 시 눈썹 내림)
     * ParamMouthOpenY = surprise * 0.8 (놀람 시 입 벌어짐)
     */
    setEmotion(tag: EmotionTag, intensity: number): void {
        const weights = this.computeEmotionWeights(tag, intensity);
        this.currentEmotion = weights;

        // 각 파라미터에 감정 가중치 적용
        this.setTarget('ParamEyeLOpen', 1.0 - weights.anger * 0.5 + weights.surprise * 0.2);
        this.setTarget('ParamEyeROpen', 1.0 - weights.anger * 0.5 + weights.surprise * 0.2);
        this.setTarget('ParamBrowLY', weights.anger * 0.5 - weights.joy * 0.3 - weights.sadness * 0.2);
        this.setTarget('ParamBrowRY', weights.anger * 0.5 - weights.joy * 0.3 - weights.sadness * 0.2);
        this.setTarget('ParamMouthForm', weights.joy * 0.5 - weights.sadness * 0.3);
    }

    /**
     * [6] 텍스트 스크립트 감정 태그 분석
     * 대사 스크립트 내 <emotion type="joy" val="0.8"/> 등 파싱
     */
    parseEmotionTag(script: string): EmotionTag {
        const match = script.match(/<emotion\s+type=["'](\w+)["']\s*\/?>/i);
        if (!match) return 'CALM';
        const tag = match[1].toUpperCase() as EmotionTag;
        return ['JOY', 'ANGER', 'SADNESS', 'CALM', 'SURPRISE'].includes(tag) ? tag : 'CALM';
    }

    /**
     * [6] Slerp 보간 — 매 프레임 호출
     * 부드러운 표정 전환
     */
    update(deltaTime: number): void {
        for (const param of this.params.values()) {
            const diff = param.targetValue - param.value;
            const step = param.blendSpeed * deltaTime * 60;
            param.value += Math.sign(diff) * Math.min(Math.abs(diff), step);
        }
    }

    /**
     * [40] 립싱크 — AnalyserNode FFT 데이터 → 입 크기
     */
    bindAnalyser(analyser: AnalyserNode): void {
        this.analyserNode = analyser;
    }

    /**
     * [40] FFT 주파수 분석 → ParamMouthOpenY
     *
     * getByteFrequencyData() → 데시벨 평균 → 0~1 매핑
     */
    updateLipSync(): void {
        if (!this.analyserNode) return;

        const data = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(data);

        // 주파수 평균 에너지 계산
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;

        // 0~255 → 0~1 매핑 (음성 대역: 0.15~0.85)
        const mouthOpen = Math.min(1, Math.max(0, (avg - 30) / 150));
        this.setTarget('ParamMouthOpenY', mouthOpen * 0.8);
    }

    private computeEmotionWeights(tag: EmotionTag, intensity: number): EmotionWeight {
        const base = { joy: 0, anger: 0, sadness: 0, calm: 0, surprise: 0 };
        switch (tag) {
            case 'JOY': return { ...base, joy: intensity, calm: 1 - intensity };
            case 'ANGER': return { ...base, anger: intensity, calm: 1 - intensity };
            case 'SADNESS': return { ...base, sadness: intensity, calm: 1 - intensity };
            case 'SURPRISE': return { ...base, calm: 1 - intensity, joy: intensity * 0.3, surprise: intensity };
            default: return { ...base, calm: 1 };
        }
    }

    private setTarget(id: string, value: number): void {
        const param = this.params.get(id);
        if (param) param.targetValue = Math.max(0, Math.min(1, value));
    }

    getParam(id: string): Live2DParameter | undefined { return this.params.get(id); }
    getCurrentEmotion(): EmotionWeight { return this.currentEmotion; }
}
