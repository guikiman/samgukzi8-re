/**
 * [Task 59] LZ-string 압축 엔진 연동 — SaveCompressor
 *
 * 세이브 데이터를 압축/해제하여 로컬스토리지 한계 극복.
 */

export class SaveCompressor {
  compress(data: string): string {
    const compressed = this.lzCompress(data);
    return compressed;
  }

  decompress(data: string): string {
    const decompressed = this.lzDecompress(data);
    return decompressed;
  }

  getCompressionRatio(original: string, compressed: string): number {
    const origSize = new TextEncoder().encode(original).length;
    const compSize = new TextEncoder().encode(compressed).length;
    if (origSize === 0) return 1;
    return Math.round((1 - compSize / origSize) * 100) / 100;
  }

  isCompressed(data: string): boolean {
    return data.startsWith("LZ:");
  }

  private lzCompress(uncompressed: string): string {
    const dictionary = new Map<string, number>();
    const data = (uncompressed + "");
    const result: string[] = [];
    const dataArray = Array.from(data);
    let current = "";
    let dictSize = 256;

    for (let i = 0; i < dataArray.length; i++) {
      const char = dataArray[i];
      const combined = current + char;

      if (dictionary.has(combined)) {
        current = combined;
      } else {
        const code = current.length > 0
          ? (dictionary.get(current) ?? current.charCodeAt(0))
          : char.charCodeAt(0);
        result.push(String.fromCharCode(code));
        dictionary.set(combined, dictSize++);
        current = char;
      }
    }

    if (current.length > 0) {
      const code = dictionary.get(current) ?? current.charCodeAt(0);
      result.push(String.fromCharCode(code));
    }

    return "LZ:" + result.join("");
  }

  private lzDecompress(compressed: string): string {
    if (!this.isCompressed(compressed)) return compressed;

    const data = compressed.slice(3);
    const dictionary = new Map<number, string>();
    const dataArray = Array.from(data);
    const result: string[] = [];
    let dictSize = 256;
    let current = dataArray[0];
    let oldEntry = current;
    result.push(current);

    for (let i = 0; i < dataArray.length; i++) {
      dictionary.set(i, String.fromCharCode(i));
    }

    dictionary.set(dataArray[0].charCodeAt(0), current);

    for (let i = 1; i < dataArray.length; i++) {
      const code = dataArray[i].charCodeAt(0);
      let entry: string;

      if (dictionary.has(code)) {
        entry = dictionary.get(code)!;
      } else if (code === dictSize) {
        entry = current + current[0];
      } else {
        entry = current;
      }

      result.push(entry);
      dictionary.set(dictSize++, current + entry[0]);
      current = entry;
    }

    return result.join("");
  }
}
