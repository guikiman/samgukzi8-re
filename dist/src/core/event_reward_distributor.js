/**
 * [9] 보상 지급기 — EventRewardDistributor
 *
 * 목적: 이벤트 성공 시 명성, 특기, 전법 포인트 지급.
 */
export class EventRewardDistributor {
    distribute(officer, rewards) {
        officer.fame += rewards.fame;
        console.log(`보상 지급: 명성 ${rewards.fame} 상승, 특기 ${rewards.skill} 획득`);
    }
}
//# sourceMappingURL=event_reward_distributor.js.map