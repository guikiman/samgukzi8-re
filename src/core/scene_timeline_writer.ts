/**
 * [8] 컷씬 타임라인 라이터 — SceneTimelineWriter
 * 
 * 목적: 대사, 일러스트 전환, BGM 제어.
 */
export class SceneTimelineWriter {
    public playScript(script: any[]): void {
        script.forEach(line => console.log(`[Scene] ${line.actor}: ${line.text}`));
    }
}
