/**
 * 로밍 이벤트 대화 시스템 [25][441-460][461-480]
 *
 * 로밍 이벤트(roaming_event_system)가 플레이어 도시에 발생하면 자동 적용 대신
 * 선택지 대화를 제공한다. 각 방문자 유형별로 2~3개의 응대 옵션이 있으며,
 * 선택에 따라 자원/명성/치안 효과가 달라진다.
 *
 * - getRoamingDialogue: 방문자 유형별 대화 씬 + 옵션 목록 (UI 렌더용)
 * - resolveRoamingDialogue: 선택 적용 — 순수 계산 후 스토어에 반영
 *   (산적 진압처럼 확률 판정이 필요한 경우 roll을 주입해 결정적 테스트 지원)
 */
/** 현자 — 기술 상담 효과 */
const SAGE_CONSULT_TECH = 8;
/** 현자 — 경전 대가 */
const SAGE_SCRIPTURE_COST = 100;
/** 현자 — 경전 명성 효과 */
const SAGE_SCRIPTURE_FAME = 5;
/** 은자 — 선양 명성 효과 */
const HERMIT_FAME_BOOST = 15;
/** 은자 — 노자 명성/기술 효과 */
const HERMIT_SCROLL_FAME = 8;
const HERMIT_SCROLL_TECH = 5;
/** 은자 — 무례 명성 페널티 */
const HERMIT_RUDE_FAME = -10;
/** 상인 — 교역 수익 */
const MERCHANT_TRADE_PROFIT = 300;
/** 상인 — 골동품 구입가 */
const MERCHANT_CURIO_COST = 200;
/** 상인 — 골동품 기술 효과 */
const MERCHANT_CURIO_TECH = 12;
/** 행상인 — 소문 치안 효과 */
const TRAVELER_GOSSIP_ORDER = 5;
/** 행상인 — 여비 지원 */
const TRAVELER_FUND_COST = 100;
const TRAVELER_FUND_FAME = 5;
/** 산적 — 공물 */
const BANDIT_TRIBUTE = 150;
/** 산적 — 기본 약탈 */
const BANDIT_PLUNDER = 200;
/** 산적 — 진압 성공 회수액 */
const BANDIT_SUPPRESS_RECOVER = 150;
/** 산적 — 진압 성공 확률 */
export const BANDIT_SUPPRESS_CHANCE = 0.5;
/** 방문자 유형별 대화 씬 생성 */
export function getRoamingDialogue(visitorType, cityName, factionName) {
    const who = factionName ? `${factionName}의 ${cityName}` : cityName;
    switch (visitorType) {
        case 'SAGE':
            return {
                visitorType,
                title: `🧙 현자 방문 — ${cityName}`,
                description: `백발의 현자가 ${who} 성문 앞에 서 있습니다. "이 땅의 지혜를 보태고자 왔소."`,
                options: [
                    { id: 'consult', label: '기술 상담을 받는다', description: '도시 기술 +8' },
                    { id: 'scripture', label: '경전을 구해온다', description: `명성 +${SAGE_SCRIPTURE_FAME} / 자금 −${SAGE_SCRIPTURE_COST}` },
                    { id: 'decline', label: '정중히 돌려보낸다', description: '효과 없음' },
                ],
            };
        case 'HERMIT':
            return {
                visitorType,
                title: `🍃 은자 방문 — ${cityName}`,
                description: `풍 신선이 ${who}에 나타나 말없이 군주를 바라봅니다.`,
                options: [
                    { id: 'accept', label: '선양을 받는다', description: `명성 +${HERMIT_FAME_BOOST}` },
                    { id: 'scroll', label: '노자를 청한다', description: `명성 +${HERMIT_SCROLL_FAME} / 기술 +${HERMIT_SCROLL_TECH}` },
                    { id: 'rude', label: '무례를 저지른다', description: `명성 ${HERMIT_RUDE_FAME}` },
                ],
            };
        case 'MERCHANT':
            return {
                visitorType,
                title: `🐫 상인단 방문 — ${cityName}`,
                description: `서역 상인단이 ${who}에 도착해 교역을 청합니다.`,
                options: [
                    { id: 'trade', label: '교역을 허가한다', description: `자금 +${MERCHANT_TRADE_PROFIT}` },
                    { id: 'curio', label: '골동품을 구입한다', description: `자금 −${MERCHANT_CURIO_COST} / 기술 +${MERCHANT_CURIO_TECH}` },
                    { id: 'expel', label: '추방한다', description: '효과 없음' },
                ],
            };
        case 'TRAVELER':
            return {
                visitorType,
                title: `🧳 행상인 방문 — ${cityName}`,
                description: `먼지가 쌓인 행상인이 ${who}에서 사방의 소문을 이야기합니다.`,
                options: [
                    { id: 'listen', label: '소문을 듣는다', description: `치안 +${TRAVELER_GOSSIP_ORDER}` },
                    { id: 'fund', label: '여비를 지원한다', description: `자금 −${TRAVELER_FUND_COST} / 명성 +${TRAVELER_FUND_FAME}` },
                    { id: 'ignore', label: '무시한다', description: '효과 없음' },
                ],
            };
        case 'BANDIT':
            return {
                visitorType,
                title: `🗡️ 산적 출몰 — ${cityName}`,
                description: `산적 무리가 ${who} 주변 곡창을 노리고 있습니다. 어떻게 하시겠습니까?`,
                options: [
                    { id: 'suppress', label: '토벌군을 파견한다', description: `성공 시 자금 +${BANDIT_SUPPRESS_RECOVER}·명성 +10 / 실패 시 자금 −100` },
                    { id: 'tribute', label: '공물을 준다', description: `자금 −${BANDIT_TRIBUTE} (피해 회피)` },
                    { id: 'ignore', label: '방치한다', description: `자금 −${BANDIT_PLUNDER} / 치안 −5` },
                ],
            };
        default:
            return {
                visitorType,
                title: `📍 방문객 — ${cityName}`,
                description: `이문의 방문객이 ${who}에 찾아왔습니다.`,
                options: [{ id: 'greet', label: '맞이한다', description: '효과 없음' }],
            };
    }
}
/** 방문자 유형별 아이콘 (방문 알림 로그용) */
export function roamingVisitorIcon(visitorType) {
    switch (visitorType) {
        case 'SAGE': return '🧙';
        case 'HERMIT': return '🍃';
        case 'MERCHANT': return '🐫';
        case 'TRAVELER': return '🧳';
        case 'BANDIT': return '🗡️';
        default: return '📍';
    }
}
/**
 * 선택지를 스토어에 적용한다. 플레이어 대화 모달에서 호출.
 * @param roll 산적 진압 등 확률 판정용 난수 (미지정 시 Math.random)
 */
export function resolveRoamingDialogue(store, visitorType, cityId, optionId, roll = Math.random()) {
    const city = store.getCity(cityId);
    if (!city)
        return { message: '방문 기록을 찾을 수 없습니다', effects: [] };
    const faction = city.ownerId ? store.getFaction(city.ownerId) : null;
    const leader = faction ? store.getOfficer(faction.leaderId) : null;
    const effects = [];
    let message = '';
    const addTech = (amount) => {
        const ds = city.developmentStats;
        store.updateCity(city.id, { developmentStats: { ...ds, technology: Math.max(0, Math.min(ds.maxTechnology, ds.technology + amount)) } });
        effects.push(`기술 ${amount >= 0 ? '+' : ''}${amount}`);
    };
    const addOrder = (amount) => {
        const ds = city.developmentStats;
        store.updateCity(city.id, { developmentStats: { ...ds, publicOrder: Math.max(0, Math.min(ds.maxPublicOrder, ds.publicOrder + amount)) } });
        effects.push(`치안 ${amount >= 0 ? '+' : ''}${amount}`);
    };
    const addCityFunds = (amount) => {
        store.updateCity(city.id, { funds: Math.max(0, city.funds + amount) });
        effects.push(`도시 자금 ${amount >= 0 ? '+' : ''}${amount}`);
    };
    const addFactionGold = (amount) => {
        if (!faction)
            return;
        store.updateFaction(faction.id, { gold: Math.max(0, faction.gold + amount) });
        effects.push(`국고 ${amount >= 0 ? '+' : ''}${amount}`);
    };
    const addLeaderFame = (amount) => {
        if (!leader)
            return;
        store.updateOfficer(leader.id, { fame: Math.max(0, Math.min(9999, leader.fame + amount)) });
        effects.push(`명성 ${amount >= 0 ? '+' : ''}${amount}`);
    };
    switch (visitorType) {
        case 'SAGE':
            if (optionId === 'consult') {
                addTech(SAGE_CONSULT_TECH);
                message = `🧙 현자와 기술을 논의했습니다 (${city.name} 기술 +${SAGE_CONSULT_TECH})`;
            }
            else if (optionId === 'scripture') {
                addCityFunds(-SAGE_SCRIPTURE_COST);
                addLeaderFame(SAGE_SCRIPTURE_FAME);
                message = `🧙 희귀 경전을 구입해 학자들에게 선보였습니다 (명성 +${SAGE_SCRIPTURE_FAME})`;
            }
            else {
                message = `🧙 현자를 정중히 배웅했습니다`;
            }
            break;
        case 'HERMIT':
            if (optionId === 'accept') {
                addLeaderFame(HERMIT_FAME_BOOST);
                message = `🍃 은자의 선양을 받았습니다 (명성 +${HERMIT_FAME_BOOST})`;
            }
            else if (optionId === 'scroll') {
                addLeaderFame(HERMIT_SCROLL_FAME);
                addTech(HERMIT_SCROLL_TECH);
                message = `🍃 은자에게 노자를 전수받았습니다 (명성 +${HERMIT_SCROLL_FAME} / 기술 +${HERMIT_SCROLL_TECH})`;
            }
            else {
                addLeaderFame(HERMIT_RUDE_FAME);
                message = `🍃 은자를 무례히 대했습니다 — 소문이 사방으로 퍼집니다 (명성 ${HERMIT_RUDE_FAME})`;
            }
            break;
        case 'MERCHANT':
            if (optionId === 'trade') {
                addFactionGold(MERCHANT_TRADE_PROFIT);
                message = `🐫 상인단과의 교역으로 수익을 올렸습니다 (자금 +${MERCHANT_TRADE_PROFIT})`;
            }
            else if (optionId === 'curio') {
                addFactionGold(-MERCHANT_CURIO_COST);
                addTech(MERCHANT_CURIO_TECH);
                message = `🐫 서역 골동품을 구입해 장인들에게 연구를 의뢰했습니다 (기술 +${MERCHANT_CURIO_TECH})`;
            }
            else {
                message = `🐫 상인단을 국경 밖으로 돌려보냈습니다`;
            }
            break;
        case 'TRAVELER':
            if (optionId === 'listen') {
                addOrder(TRAVELER_GOSSIP_ORDER);
                message = `🧳 행상인의 소문에 귀 기울였습니다 (치안 +${TRAVELER_GOSSIP_ORDER})`;
            }
            else if (optionId === 'fund') {
                addCityFunds(-TRAVELER_FUND_COST);
                addLeaderFame(TRAVELER_FUND_FAME);
                message = `🧳 행상인의 여비를 지원했습니다 — 고마움을 전합니다 (명성 +${TRAVELER_FUND_FAME})`;
            }
            else {
                message = `🧳 행상인을 무시하고 지나쳤습니다`;
            }
            break;
        case 'BANDIT':
            if (optionId === 'suppress') {
                if (roll < BANDIT_SUPPRESS_CHANCE) {
                    addCityFunds(BANDIT_SUPPRESS_RECOVER);
                    addLeaderFame(10);
                    message = `🗡️ 산적 토벌에 성공했습니다! 탈취물을 회수했습니다 (자금 +${BANDIT_SUPPRESS_RECOVER} / 명성 +10)`;
                }
                else {
                    addCityFunds(-100);
                    message = `🗡️ 산적 토벌에 실패해 추가 피해를 입었습니다 (자금 −100)`;
                }
            }
            else if (optionId === 'tribute') {
                addCityFunds(-BANDIT_TRIBUTE);
                message = `🗡️ 산적에게 공물을 주어 물러나게 했습니다 (자금 −${BANDIT_TRIBUTE})`;
            }
            else {
                addCityFunds(-BANDIT_PLUNDER);
                addOrder(-5);
                message = `🗡️ 산적이 ${city.name}을(를) 약탈했습니다 (자금 −${BANDIT_PLUNDER} / 치안 −5)`;
            }
            break;
        default:
            message = '방문객을 맞이했습니다';
            break;
    }
    return { message, effects };
}
//# sourceMappingURL=roaming_dialogue_system.js.map