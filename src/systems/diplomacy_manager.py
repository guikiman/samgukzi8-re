"""
[Phase 6] 인사 및 외교 시스템 — Personnel & Diplomacy Manager
파일: src/systems/diplomacy_manager.py

설계 스펙:
- [64-67] 인사: 등용/천거, 포상/수여, 몰수, 해고
- [68-69] 신분 임명: 군사, 도독, 태수
- [70-73] 외교: 동맹/파기, 항복 권고, 친선(증정), 원군 요청
- [74-75] 계략: 파괴, 이간
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple, Set
from enum import Enum, auto
import random

class FactionRelation(Enum):
    ALLIANCE = "alliance"
    NEUTRAL = "neutral"
    WAR = "war"
    SURRENDERED = "surrendered"

class OfficerRank(Enum):
    RULER = "ruler"          # 군주
    VICEROY = "viceroy"      # 도독
    PREFECT = "prefect"      # 태수
    STRATEGIST = "strategist" # 군사
    REGULAR = "regular"      # 일반
    RECLUSE = "recluse"      # 재야
    FREE = "free"            # 방랑군

class PersonnelManager:

    def __init__(self):
        self._officers: Dict[str, Dict[str, Any]] = {}
        self._factions: Dict[str, Dict[str, Any]] = {}

    def recruit(self, recruiter_id: str, target_id: str,
                recruiter_faction: str, loyalty_bonus: int = 20) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        target = self._officers.get(target_id)
        if not target:
            result['message'] = '대상 무장이 존재하지 않습니다.'
            return result

        current_faction = target.get('faction_id')
        if current_faction == recruiter_faction:
            result['message'] = '이미 같은 세력 소속입니다.'
            return result

        recruit_chance = 50
        if current_faction:
            loyalty = target.get('loyalty', 50)
            recruit_chance -= loyalty // 2

        if random.randint(1, 100) <= recruit_chance:
            target['faction_id'] = recruiter_faction
            target['loyalty'] = loyalty_bonus
            target['rank'] = OfficerRank.REGULAR.value
            result['success'] = True
            result['message'] = f'{target.get("name", target_id)}을(를) 성공적으로 등용했습니다.'
        else:
            result['message'] = f'{target.get("name", target_id)}이(가) 등용을 거절했습니다.'

        return result

    def reward(self, officer_id: str, gold_amount: int) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        officer = self._officers.get(officer_id)
        if not officer:
            result['message'] = '무장이 존재하지 않습니다.'
            return result

        loyalty_gain = gold_amount // 100
        officer['loyalty'] = min(100, officer.get('loyalty', 50) + loyalty_gain)
        result['success'] = True
        result['message'] = f'충성도가 {loyalty_gain} 상승했습니다.'
        return result

    def confiscate(self, ruler_id: str, target_id: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        target = self._officers.get(target_id)
        if not target:
            result['message'] = '대상 무장이 존재하지 않습니다.'
            return result

        if target.get('faction_id') != self._officers.get(ruler_id, {}).get('faction_id'):
            result['message'] = '같은 세력의 무장만 몰수할 수 있습니다.'
            return result

        target['loyalty'] = max(0, target.get('loyalty', 50) - 30)
        items = target.get('items', [])
        target['items'] = []
        result['success'] = True
        result['message'] = f'아이템 {len(items)}개를 몰수했습니다. 충성도가 30 하락합니다.'
        return result

    def dismiss(self, ruler_id: str, target_id: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        target = self._officers.get(target_id)
        if not target:
            result['message'] = '대상 무장이 존재하지 않습니다.'
            return result

        target['faction_id'] = None
        target['rank'] = OfficerRank.RECLUSE.value
        result['success'] = True
        result['message'] = f'{target.get("name", target_id)}을(를) 해고했습니다.'
        return result

    def appoint(self, officer_id: str, rank: OfficerRank) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        officer = self._officers.get(officer_id)
        if not officer:
            result['message'] = '대상 무장이 존재하지 않습니다.'
            return result

        officer['rank'] = rank.value
        result['success'] = True
        result['message'] = f'{officer.get("name", officer_id)}을(를) {rank.value}로 임명했습니다.'
        return result


class DiplomacyManager:

    def __init__(self):
        self._relations: Dict[Tuple[str, str], FactionRelation] = {}
        self._faction_data: Dict[str, Dict[str, Any]] = {}

    def get_relation(self, faction_a: str, faction_b: str) -> FactionRelation:
        key = tuple(sorted([faction_a, faction_b]))
        return self._relations.get(key, FactionRelation.NEUTRAL)

    def set_relation(self, faction_a: str, faction_b: str, relation: FactionRelation) -> None:
        key = tuple(sorted([faction_a, faction_b]))
        self._relations[key] = relation

    def form_alliance(self, faction_a: str, faction_b: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        current = self.get_relation(faction_a, faction_b)
        if current == FactionRelation.WAR:
            result['message'] = '전쟁 중인 세력과 동맹할 수 없습니다.'
            return result
        self.set_relation(faction_a, faction_b, FactionRelation.ALLIANCE)
        result['success'] = True
        result['message'] = '동맹을 체결했습니다.'
        return result

    def break_alliance(self, faction_a: str, faction_b: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        if self.get_relation(faction_a, faction_b) != FactionRelation.ALLIANCE:
            result['message'] = '동맹 상태가 아닙니다.'
            return result
        self.set_relation(faction_a, faction_b, FactionRelation.NEUTRAL)
        result['success'] = True
        result['message'] = '동맹을 파기했습니다.'
        return result

    def declare_war(self, faction_a: str, faction_b: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        self.set_relation(faction_a, faction_b, FactionRelation.WAR)
        result['success'] = True
        result['message'] = '전쟁을 선포했습니다.'
        return result

    def persuade_surrender(self, target_faction: str, persuader_faction: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        target = self._faction_data.get(target_faction)
        if not target:
            result['message'] = '대상 세력이 존재하지 않습니다.'
            return result

        persuader = self._faction_data.get(persuader_faction)
        if not persuader:
            result['message'] = '세력 데이터가 없습니다.'
            return result

        target_power = target.get('total_power', 0)
        persuader_power = persuader.get('total_power', 0)

        if target_power == 0 or (persuader_power / max(target_power, 1)) >= 3:
            self.set_relation(target_faction, persuader_faction, FactionRelation.SURRENDERED)
            result['success'] = True
            result['message'] = f'{target_faction}이(가) 항복했습니다.'
        else:
            result['message'] = '상대 세력이 항복을 거부했습니다.'
        return result

    def send_gift(self, from_faction: str, to_faction: str,
                  gold: int = 0, food: int = 0) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        if self.get_relation(from_faction, to_faction) == FactionRelation.WAR:
            result['message'] = '전쟁 중인 세력에게 선물할 수 없습니다.'
            return result

        relation = self.get_relation(from_faction, to_faction)
        if relation == FactionRelation.NEUTRAL:
            self.set_relation(from_faction, to_faction, FactionRelation.ALLIANCE)
        result['success'] = True
        result['message'] = f'금 {gold}, 식량 {food}을(를) 증정했습니다.'
        return result

    def request_reinforcements(self, from_faction: str, target_faction: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        if self.get_relation(from_faction, target_faction) != FactionRelation.ALLIANCE:
            result['message'] = '동맹 세력에게만 원군을 요청할 수 있습니다.'
            return result

        if random.randint(1, 100) <= 70:
            result['success'] = True
            result['message'] = f'{target_faction}이(가) 원군을 보내기로 했습니다.'
        else:
            result['message'] = f'{target_faction}이(가) 원군 요청을 거절했습니다.'
        return result

    def form_vassalage(self, suzerain: str, vassal: str) -> bool:
        self.set_relation(suzerain, vassal, FactionRelation.SURRENDERED)
        return True

    def exchange_hostages(self, faction_a: str, faction_b: str, hostage_a: str, hostage_b: str) -> bool:
        return True

    def declare_proxy_war(self, sponsor: str, target: str, proxy: str) -> bool:
        return True

    def negotiate_release(self, prisoner_id: str, gold_offer: int) -> Dict[str, Any]:
        if gold_offer >= 500:
            return {'success': True, 'message': '포로를 석방했습니다.'}
        return {'success': False, 'message': '몸값이 부족합니다.'}

    def plant_spy(self, officer_id: str) -> Dict[str, Any]:
        # [150] 이중 스파이 심기
        success = random.random() < 0.3
        return {'success': success, 'message': '성공' if success else '실패'}

    def spread_rumor(self, target_faction: str, content: str) -> Dict[str, Any]:
        # [151, 159] 외교 이간질 및 소문 조작
        return {'success': True, 'message': f'{target_faction}에 소문을 퍼뜨렸습니다.'}


class SchemeManager:

    def __init__(self, personnel: PersonnelManager, diplomacy: DiplomacyManager):
        self.personnel = personnel
        self.diplomacy = diplomacy

    def sabotage(self, target_city_id: str, target_faction: str,
                 investment: int) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        if investment < 100:
            result['message'] = '최소 100의 금이 필요합니다.'
            return result

        success_chance = min(70, investment // 50)
        if random.randint(1, 100) <= success_chance:
            result['success'] = True
            result['message'] = f'{target_city_id}의 성벽을 파괴했습니다.'
        else:
            result['message'] = '파괴 계략이 실패했습니다.'
        return result

    def sow_discord(self, target_faction: str, target_officer: str,
                    investment: int) -> Dict[str, Any]:
        result: Dict[str, Any] = {'success': False, 'message': ''}
        if investment < 200:
            result['message'] = '최소 200의 금이 필요합니다.'
            return result

        success_chance = min(60, investment // 100)
        if random.randint(1, 100) <= success_chance:
            officer = self.personnel._officers.get(target_officer)
            if officer:
                officer['loyalty'] = max(0, officer.get('loyalty', 50) - 20)
            result['success'] = True
            result['message'] = f'{target_officer}의 충성도가 20 하락했습니다.'
        else:
            result['message'] = '이간질이 실패했습니다.'
        return result

    def hire_barbarian_mercenary(self, faction_id: str, tribe: str) -> bool:
        # [351] 이민족 용병 고용
        return True

    def accept_exile_government(self, host_faction: str, guest_faction: str) -> bool:
        # [352] 망명 정부 수용
        return True
