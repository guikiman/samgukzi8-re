// 경제 시뮬레이션: 월간 수입/지출 순환 검증 (시나리오 05, 유비 세력)
// 프로젝트 루트에서 실행: node tests/econ_monthly_sim.mjs (vitest 대신 순수 node는 ts 못 읽으므로 dist 사용)
import { buildWorld } from '../dist/src/core/scenario_system.js';

const fs = await import('fs');
const scenarioIndex = JSON.parse(fs.readFileSync(new URL('../src/data/scenarios/index.json', import.meta.url), 'utf8'));

const scenario = Array.isArray(scenarioIndex) ? scenarioIndex.find(s => s.id === '05') : scenarioIndex.scenarios?.find(s => s.id === '05');
if (!scenario) { console.error('scenario 05 not found'); process.exit(1); }

// 시나리오 05: 조오(0), 손권(1), 유비(2)
const world = buildWorld(scenario, 2);
const { factions, cities } = world;

const liuFaction = factions.find(f => f.leaderId === 'liu_bei');
console.log('=== 초기 상태 (유비 세력) ===');
console.log(`세력 골드: ${liuFaction.gold}, 군량: ${liuFaction.food}`);

const liuCities = cities.filter(c => c.ownerId === liuFaction.id);
let totalGoldIncome = 0, totalFoodIncome = 0;
for (const c of liuCities) {
  console.log(`${c.name}: goldIncome=${c.goldIncome} foodIncome=${c.foodIncome} funds=${c.funds}`);
  totalGoldIncome += c.goldIncome; totalFoodIncome += c.foodIncome;
}
console.log(`월간 총 수입: 골드 ${totalGoldIncome}, 군량 ${totalFoodIncome}`);
console.log(`도시 funds 총합(내정 재원): ${liuCities.reduce((s, c) => s + c.funds, 0)}`);

console.log('\n=== 실제 엔진 규칙 흐름 검증 ===');
console.log('1) 유저 내정(징병/개발 등): city.funds에서 차감');
console.log('2) 월말 processMonthlyMaintenance: faction.gold += sum(city.goldIncome)');
console.log(`3) 도시 funds에 월 수입 유입 경로: 없음 ← 확인 필요`);

// 12개월 시뮬레이션: 도시 funds로만 내정 가능 (현재 규칙)
let funds = liuCities.reduce((s, c) => s + c.funds, 0);
let gold = liuFaction.gold;
const log = [];
for (let m = 1; m <= 12; m++) {
  // 매달: 개발(-250) + 징병(-200) = -450 도시 funds
  funds -= 450;
  gold += totalGoldIncome;
  if (funds < 0) { log.push(`${m}월: 도시 funds 고갈 → 내정 불가 (잔액 ${funds})`); break; }
  log.push(`${m}월: 도시funds=${funds}, 세력gold=${gold}`);
}
console.log('\n=== 12개월 시뮬레이션 (도시 funds 기반 내정) ===');
console.log(log.join('\n'));

process.exit(0);
