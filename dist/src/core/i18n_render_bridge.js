/**
 * [Task 49] 국제화(i18n) 대응 텍스트 현지화 렌더 브릿지
 *
 * 오케스트레이터가 방출하는 시스템 이벤트 메시지가
 * 로케일 환경(Ko, En, Ja)에 맞춰 치환되어 전달.
 */
export class I18nRenderBridge {
    constructor() {
        this.locale = "ko";
        this.translations = new Map();
    }
    setLocale(locale) {
        this.locale = locale;
    }
    register(key, translations) {
        this.translations.set(key, translations);
    }
    translate(key) {
        const entry = this.translations.get(key);
        if (!entry)
            return key;
        return entry[this.locale] ?? key;
    }
    registerBatch(entries) {
        for (const [key, translations] of Object.entries(entries)) {
            this.translations.set(key, translations);
        }
    }
}
//# sourceMappingURL=i18n_render_bridge.js.map