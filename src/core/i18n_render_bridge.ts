/**
 * [Task 49] 국제화(i18n) 대응 텍스트 현지화 렌더 브릿지
 *
 * 오케스트레이터가 방출하는 시스템 이벤트 메시지가
 * 로케일 환경(Ko, En, Ja)에 맞춰 치환되어 전달.
 */

export type Locale = "ko" | "en" | "ja";

export class I18nRenderBridge {
  private locale: Locale = "ko";
  private translations = new Map<string, Record<Locale, string>>();

  setLocale(locale: Locale): void {
    this.locale = locale;
  }

  register(key: string, translations: Record<Locale, string>): void {
    this.translations.set(key, translations);
  }

  translate(key: string): string {
    const entry = this.translations.get(key);
    if (!entry) return key;
    return entry[this.locale] ?? key;
  }

  registerBatch(entries: Record<string, Record<Locale, string>>): void {
    for (const [key, translations] of Object.entries(entries)) {
      this.translations.set(key, translations);
    }
  }
}
