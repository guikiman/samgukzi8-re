/**
 * 삼국지 8 리메이크 — 커맨드 패턴 시스템
 * 파일: src/core/command_system.ts
 *
 * 커맨드 패턴 + 큐 + Undo/Redo 구현
 * 모든 무장 행동을 Command 객체로 캡슐화
 */
import { OfficerStatus, } from './types.js';
let cmdCounter = 0;
function genCmdId(prefix) {
    cmdCounter += 1;
    return `${prefix}_${Date.now().toString(36)}_${cmdCounter}`;
}
class BaseCommand {
    constructor(type, officerId, turnIssued) {
        this.sideEffects = [];
        this.id = genCmdId(type.toLowerCase());
        this.type = type;
        this.officerId = officerId;
        this.turnIssued = turnIssued;
        this.timestamp = Date.now();
    }
    buildResult(success, message) {
        return { success, message, sideEffects: this.sideEffects };
    }
    recordSideEffect(target, targetId, field, oldValue, newValue) {
        this.sideEffects.push({ target, targetId, field, oldValue, newValue });
    }
}
// ============================================================
// [DOMESTIC] 내정 커맨드
// ============================================================
export class DomesticCommand extends BaseCommand {
    constructor(officerId, cityId, facilityType, turn) {
        super('DOMESTIC', officerId, turn);
        this.cityId = cityId;
        this.facilityType = facilityType;
        this.goldCost = 100;
        this.statKey = 'politics';
    }
    execute(context) {
        const officer = context.store.getOfficer(this.officerId);
        const city = context.store.getCity(this.cityId);
        if (!officer || !city)
            return this.buildResult(false, '무장 또는 도시 없음');
        if (officer.actionPoints < 10)
            return this.buildResult(false, '행동력 부족');
        const oldAP = officer.actionPoints;
        const oldDev = city.development;
        const statValue = officer.stats[this.statKey];
        const gain = Math.floor(statValue * 0.1) + 5;
        context.store.updateOfficer(this.officerId, {
            actionPoints: oldAP - 10,
            exp: { ...officer.exp, [this.statKey]: officer.exp[this.statKey] + 5 },
        });
        context.store.updateCity(this.cityId, { development: oldDev + gain });
        this.recordSideEffect('officer', this.officerId, 'actionPoints', oldAP, oldAP - 10);
        this.recordSideEffect('city', this.cityId, 'development', oldDev, oldDev + gain);
        context.logger(`[내정] ${officer.name} → ${city.name} 개발 +${gain}`);
        return this.buildResult(true, `${city.name} 개발 +${gain}`);
    }
    undo(context) {
        for (const se of this.sideEffects) {
            if (se.target === 'officer') {
                const off = context.store.getOfficer(se.targetId);
                if (off)
                    context.store.updateOfficer(se.targetId, { ...off, [se.field]: se.oldValue });
            }
            else if (se.target === 'city') {
                const c = context.store.getCity(se.targetId);
                if (c)
                    context.store.updateCity(se.targetId, { ...c, [se.field]: se.oldValue });
            }
        }
        return true;
    }
    serialize() {
        return {
            id: this.id, type: this.type, officerId: this.officerId,
            turnIssued: this.turnIssued, timestamp: this.timestamp,
            payload: { cityId: this.cityId, facilityType: this.facilityType, goldCost: this.goldCost },
        };
    }
}
// ============================================================
// [TRAINING] 훈련 커맨드
// ============================================================
export class TrainingCommand extends BaseCommand {
    constructor(officerId, statKey, turn) {
        super('TRAINING', officerId, turn);
        this.statKey = statKey;
    }
    execute(context) {
        const officer = context.store.getOfficer(this.officerId);
        if (!officer)
            return this.buildResult(false, '무장 없음');
        if (officer.actionPoints < 10)
            return this.buildResult(false, '행동력 부족');
        if (officer.stamina < 20)
            return this.buildResult(false, '기력 부족');
        const oldAP = officer.actionPoints;
        const oldStamina = officer.stamina;
        const oldExp = officer.exp[this.statKey];
        const expGain = 10 + Math.floor(officer.stats[this.statKey] * 0.05);
        const newExp = Math.min(100, oldExp + expGain);
        context.store.updateOfficer(this.officerId, {
            actionPoints: oldAP - 10,
            stamina: oldStamina - 20,
            exp: { ...officer.exp, [this.statKey]: newExp },
        });
        this.recordSideEffect('officer', this.officerId, 'actionPoints', oldAP, oldAP - 10);
        this.recordSideEffect('officer', this.officerId, 'stamina', oldStamina, oldStamina - 20);
        this.recordSideEffect('officer', this.officerId, `exp.${this.statKey}`, oldExp, newExp);
        context.logger(`[훈련] ${officer.name} ${this.statKey} 경험치 +${expGain}`);
        return this.buildResult(true, `${this.statKey} 경험치 +${expGain}`);
    }
    undo(context) {
        const officer = context.store.getOfficer(this.officerId);
        if (!officer)
            return false;
        for (const se of this.sideEffects) {
            if (se.field.startsWith('exp.')) {
                const key = se.field.split('.')[1];
                context.store.updateOfficer(this.officerId, { exp: { ...officer.exp, [key]: se.oldValue } });
            }
            else {
                context.store.updateOfficer(this.officerId, { [se.field]: se.oldValue });
            }
        }
        return true;
    }
    serialize() {
        return {
            id: this.id, type: this.type, officerId: this.officerId,
            turnIssued: this.turnIssued, timestamp: this.timestamp,
            payload: { statKey: this.statKey },
        };
    }
}
// ============================================================
// [RECRUITMENT] 등용 커맨드
// ============================================================
export class RecruitmentCommand extends BaseCommand {
    constructor(officerId, targetOfficerId, turn) {
        super('RECRUITMENT', officerId, turn);
        this.targetOfficerId = targetOfficerId;
    }
    execute(context) {
        const officer = context.store.getOfficer(this.officerId);
        const target = context.store.getOfficer(this.targetOfficerId);
        if (!officer || !target)
            return this.buildResult(false, '무장 없음');
        if (officer.actionPoints < 20)
            return this.buildResult(false, '행동력 부족');
        if (target.factionId !== null)
            return this.buildResult(false, '이미 소속된 무장');
        const officerFaction = officer.factionId ? context.store.getFaction(officer.factionId) : null;
        if (!officerFaction)
            return this.buildResult(false, '세력 없음');
        const charismaFactor = officer.stats.charisma / 100;
        const loyaltyFactor = 1 - (target.loyalty / 100);
        const successRate = Math.min(0.95, charismaFactor * 0.5 + loyaltyFactor * 0.3 + 0.2);
        if (Math.random() > successRate) {
            context.store.updateOfficer(this.officerId, { actionPoints: officer.actionPoints - 20 });
            this.recordSideEffect('officer', this.officerId, 'actionPoints', officer.actionPoints, officer.actionPoints - 20);
            context.logger(`[등용] ${officer.name} → ${target.name} 등용 실패`);
            return this.buildResult(false, '등용 실패');
        }
        const oldFaction = target.factionId;
        const oldStatus = target.status;
        const oldCity = target.cityId;
        context.store.updateOfficer(this.targetOfficerId, {
            factionId: officer.factionId,
            status: OfficerStatus.OFFICER,
            cityId: officer.cityId,
            loyalty: Math.min(100, target.loyalty + 20),
        });
        context.store.updateOfficer(this.officerId, { actionPoints: officer.actionPoints - 20 });
        if (officerFaction && !officerFaction.officers.includes(this.targetOfficerId)) {
            const newOfficerList = [...officerFaction.officers, this.targetOfficerId];
            context.store.updateFaction(officerFaction.id, { officers: newOfficerList });
        }
        this.recordSideEffect('officer', this.targetOfficerId, 'factionId', oldFaction, officer.factionId);
        this.recordSideEffect('officer', this.targetOfficerId, 'status', oldStatus, 'OFFICER');
        this.recordSideEffect('officer', this.officerId, 'actionPoints', officer.actionPoints, officer.actionPoints - 20);
        context.logger(`[등용] ${officer.name} → ${target.name} 등용 성공`);
        return this.buildResult(true, `${target.name} 등용 성공`);
    }
    undo(context) {
        for (const se of this.sideEffects) {
            const off = context.store.getOfficer(se.targetId);
            if (off)
                context.store.updateOfficer(se.targetId, { ...off, [se.field]: se.oldValue });
        }
        return true;
    }
    serialize() {
        return {
            id: this.id, type: this.type, officerId: this.officerId,
            turnIssued: this.turnIssued, timestamp: this.timestamp,
            payload: { targetOfficerId: this.targetOfficerId },
        };
    }
}
// ============================================================
// [MOVEMENT] 이동 커맨드
// ============================================================
export class MovementCommand extends BaseCommand {
    constructor(officerId, fromCityId, toCityId, turn) {
        super('MOVEMENT', officerId, turn);
        this.fromCityId = fromCityId;
        this.toCityId = toCityId;
    }
    execute(context) {
        const officer = context.store.getOfficer(this.officerId);
        const fromCity = context.store.getCity(this.fromCityId);
        const toCity = context.store.getCity(this.toCityId);
        if (!officer || !fromCity || !toCity)
            return this.buildResult(false, '무장 또는 도시 없음');
        if (officer.actionPoints < 30)
            return this.buildResult(false, '행동력 부족');
        const oldAP = officer.actionPoints;
        const oldCity = officer.cityId;
        context.store.updateOfficer(this.officerId, {
            actionPoints: oldAP - 30,
            cityId: this.toCityId,
        });
        const newFromOfficers = fromCity.officerIds.filter(id => id !== this.officerId);
        context.store.updateCity(this.fromCityId, { officerIds: newFromOfficers });
        const newToOfficers = toCity.officerIds.includes(this.officerId)
            ? toCity.officerIds
            : [...toCity.officerIds, this.officerId];
        context.store.updateCity(this.toCityId, { officerIds: newToOfficers });
        this.recordSideEffect('officer', this.officerId, 'actionPoints', oldAP, oldAP - 30);
        this.recordSideEffect('officer', this.officerId, 'cityId', oldCity, this.toCityId);
        this.recordSideEffect('city', this.fromCityId, 'officerIds', fromCity.officerIds, newFromOfficers);
        this.recordSideEffect('city', this.toCityId, 'officerIds', toCity.officerIds, newToOfficers);
        context.logger(`[이동] ${officer.name}: ${fromCity.name} → ${toCity.name}`);
        return this.buildResult(true, `${fromCity.name} → ${toCity.name}`);
    }
    undo(context) {
        for (const se of this.sideEffects) {
            if (se.target === 'officer') {
                const off = context.store.getOfficer(se.targetId);
                if (off)
                    context.store.updateOfficer(se.targetId, { ...off, [se.field]: se.oldValue });
            }
            else if (se.target === 'city') {
                const c = context.store.getCity(se.targetId);
                if (c)
                    context.store.updateCity(se.targetId, { ...c, [se.field]: se.oldValue });
            }
        }
        return true;
    }
    serialize() {
        return {
            id: this.id, type: this.type, officerId: this.officerId,
            turnIssued: this.turnIssued, timestamp: this.timestamp,
            payload: { fromCityId: this.fromCityId, toCityId: this.toCityId },
        };
    }
}
// ============================================================
// [REST] 휴양 커맨드
// ============================================================
export class RestCommand extends BaseCommand {
    constructor(officerId, turn) {
        super('REST', officerId, turn);
    }
    execute(context) {
        const officer = context.store.getOfficer(this.officerId);
        if (!officer)
            return this.buildResult(false, '무장 없음');
        const oldStamina = officer.stamina;
        const oldHP = officer.hp;
        const newStamina = Math.min(officer.maxStamina, oldStamina + 50);
        const newHP = Math.min(officer.maxHp, oldHP + 10);
        context.store.updateOfficer(this.officerId, { stamina: newStamina, hp: newHP });
        this.recordSideEffect('officer', this.officerId, 'stamina', oldStamina, newStamina);
        this.recordSideEffect('officer', this.officerId, 'hp', oldHP, newHP);
        context.logger(`[휴양] ${officer.name} 기력 +${newStamina - oldStamina}`);
        return this.buildResult(true, '휴양 완료');
    }
    undo(context) {
        for (const se of this.sideEffects) {
            const off = context.store.getOfficer(se.targetId);
            if (off)
                context.store.updateOfficer(se.targetId, { ...off, [se.field]: se.oldValue });
        }
        return true;
    }
    serialize() {
        return {
            id: this.id, type: this.type, officerId: this.officerId,
            turnIssued: this.turnIssued, timestamp: this.timestamp,
            payload: {},
        };
    }
}
// ============================================================
// 커맨드 역직렬화 (저장/로드용)
// ============================================================
export function deserializeCommand(data) {
    const base = { officerId: data.officerId, turn: data.turnIssued };
    switch (data.type) {
        case 'DOMESTIC':
            return new DomesticCommand(base.officerId, data.payload.cityId, data.payload.facilityType, base.turn);
        case 'TRAINING':
            return new TrainingCommand(base.officerId, data.payload.statKey, base.turn);
        case 'RECRUITMENT':
            return new RecruitmentCommand(base.officerId, data.payload.targetOfficerId, base.turn);
        case 'MOVEMENT':
            return new MovementCommand(base.officerId, data.payload.fromCityId, data.payload.toCityId, base.turn);
        case 'REST':
            return new RestCommand(base.officerId, base.turn);
        default:
            return new RestCommand(base.officerId, base.turn);
    }
}
// ============================================================
// 커맨드 큐 — FIFO 실행 + Undo/Redo 스택
// ============================================================
export class CommandQueue {
    constructor(maxHistory = 200) {
        this.pending = [];
        this.executed = [];
        this.undone = [];
        this.maxHistory = maxHistory;
    }
    enqueue(command) {
        this.pending.push(command);
    }
    dequeue() {
        return this.pending.shift();
    }
    executeNext(context) {
        const cmd = this.pending.shift();
        if (!cmd)
            return null;
        const result = cmd.execute(context);
        if (result.success) {
            this.executed.push(cmd);
            if (this.executed.length > this.maxHistory)
                this.executed.shift();
            this.undone = [];
        }
        return result;
    }
    executeAll(context) {
        const results = [];
        while (this.pending.length > 0) {
            const result = this.executeNext(context);
            if (result)
                results.push(result);
        }
        return results;
    }
    undoLast(context) {
        const cmd = this.executed.pop();
        if (!cmd)
            return false;
        const success = cmd.undo(context);
        if (success)
            this.undone.push(cmd);
        return success;
    }
    redoLast(context) {
        const cmd = this.undone.pop();
        if (!cmd)
            return false;
        const result = cmd.execute(context);
        if (result.success) {
            this.executed.push(cmd);
            return true;
        }
        this.undone.push(cmd);
        return false;
    }
    clear() {
        this.pending = [];
        this.executed = [];
        this.undone = [];
    }
    getPendingCount() { return this.pending.length; }
    getExecutedCount() { return this.executed.length; }
    canUndo() { return this.executed.length > 0; }
    canRedo() { return this.undone.length > 0; }
    serializeAll() {
        return [...this.pending, ...this.executed].map(c => c.serialize());
    }
}
//# sourceMappingURL=command_system.js.map