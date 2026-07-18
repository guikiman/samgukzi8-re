/**
 * [86] 밀담 및 영입 공작망 — SecretTalkManager
 *
 * 목적: 우호 무장 내통 및 영입 공작.
 */
export class SecretTalkManager {
    plotSecretTalk(target, faction) {
        console.log(`[Intrigue] ${target.name}에 대한 밀담 실행.`);
        return Math.random() < 0.3;
    }
}
//# sourceMappingURL=secret_talk_manager.js.map