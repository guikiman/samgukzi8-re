/**
 * [Task 49] 국제화(i18n) 대응 텍스트 현지화 렌더 브릿지
 *
 * 오케스트레이터가 방출하는 시스템 이벤트 메시지가
 * 로케일 환경(Ko, En, Ja)에 맞춰 치환되어 전달.
 */
export type Locale = "ko" | "en" | "ja";
export declare class I18nRenderBridge {
    private locale;
    private translations;
    setLocale(locale: Locale): void;
    register(key: string, translations: Record<Locale, string>): void;
    translate(key: string): string;
    registerBatch(entries: Record<string, Record<Locale, string>>): void;
}
//# sourceMappingURL=i18n_render_bridge.d.ts.map