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
    readonly joy: number;
    readonly anger: number;
    readonly sadness: number;
    readonly calm: number;
    readonly surprise: number;
}
export interface Live2DParameter {
    readonly id: string;
    value: number;
    targetValue: number;
    readonly blendSpeed: number;
}
export declare class Live2DEmotionController {
    private params;
    private currentEmotion;
    private analyserNode;
    constructor();
    /**
     * [6] Live2D 파라미터 맵 등록 (Cubism 4.x 호환)
     */
    private registerDefaultParams;
    /**
     * [6] 감정 태그 → Live2D 파라미터 오프셋
     *
     * E = [joy, anger, sadness, calm]
     * ParamEyeLOpen = 1.0 - anger * 0.5 (분노 시 눈 가늘어짐)
     * ParamBrowLY = anger * 0.5 - joy * 0.3 (분노 시 눈썹 내림)
     * ParamMouthOpenY = surprise * 0.8 (놀람 시 입 벌어짐)
     */
    setEmotion(tag: EmotionTag, intensity: number): void;
    /**
     * [6] 텍스트 스크립트 감정 태그 분석
     * 대사 스크립트 내 <emotion type="joy" val="0.8"/> 등 파싱
     */
    parseEmotionTag(script: string): EmotionTag;
    /**
     * [6] Slerp 보간 — 매 프레임 호출
     * 부드러운 표정 전환
     */
    update(deltaTime: number): void;
    /**
     * [40] 립싱크 — AnalyserNode FFT 데이터 → 입 크기
     */
    bindAnalyser(analyser: AnalyserNode): void;
    /**
     * [40] FFT 주파수 분석 → ParamMouthOpenY
     *
     * getByteFrequencyData() → 데시벨 평균 → 0~1 매핑
     */
    updateLipSync(): void;
    private computeEmotionWeights;
    private setTarget;
    getParam(id: string): Live2DParameter | undefined;
    getCurrentEmotion(): EmotionWeight;
}
//# sourceMappingURL=live2d_controller.d.ts.map