"""
[Phase 5] 도시 내정 시스템 및 시설 기능 — City Management & Facility System
파일: src/systems/city_manager.py

설계 스펙:
- [49-63] 도시 데이터 모델: 인구, 금, 식량, 기술, 방어, 시설
- 내정 명령: 시장(상업), 농지(농업), 병영(병력), 훈련, 징병, 성벽
- 턴별 도시 상태 갱신 및 세력 영향 계산
- graph_db.py, event_engine.py와 연동
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum, auto

# ============================================================================
# 1. 시설 유형 및 데이터 모델
# ============================================================================

class FacilityType(Enum):
    MARKET = "market"           # 시장 (금 수입 증가)
    FARMLAND = "farmland"       # 농지 (식량 생산 증가)
    BARRACKS = "barracks"       # 병영 (병력 최대치 증가)
    TRAINING = "training"       # 훈련소 (훈련도 증가)
    WALL = "wall"               # 성벽 (방어력 증가)
    WORKSHOP = "workshop"       # 공방 (기술력 증가)
    GRANARY = "granary"         # 창고 (식량 저장 한도 증가)

@dataclass(slots=True)
class FacilityData:
    type: FacilityType
    level: int = 1
    max_level: int = 5
    investment: int = 0

    def upgrade_cost(self) -> int:
        return self.level * 200

    def effect_value(self) -> int:
        return self.level * 10

    def to_dict(self) -> dict:
        return {
            'type': self.type.value,
            'level': self.level,
            'max_level': self.max_level,
            'investment': self.investment
        }

@dataclass(slots=True)
class CityData:
    city_id: str
    name: str
    faction_id: Optional[str] = None
    population: int = 10000
    gold: int = 500
    food: int = 5000
    tech: int = 0
    defense: int = 100
    soldiers: int = 1000
    training: int = 50
    morale: int = 50
    riot_risk: int = 0  # [148] 민란 위험도 추가
    facilities: Dict[str, FacilityData] = field(default_factory=dict)
    officers: List[str] = field(default_factory=list)
    neighbor_cities: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            'city_id': self.city_id,
            'name': self.name,
            'faction_id': self.faction_id,
            'population': self.population,
            'gold': self.gold,
            'food': self.food,
            'tech': self.tech,
            'defense': self.defense,
            'soldiers': self.soldiers,
            'training': self.training,
            'morale': self.morale,
            'facilities': {k: v.to_dict() for k, v in self.facilities.items()},
            'officers': self.officers,
            'neighbor_cities': self.neighbor_cities
        }

class CityManager:

    def __init__(self):
        self._cities: Dict[str, CityData] = {}

    def add_city(self, city: CityData) -> None:
        self._cities[city.city_id] = city

    def get_city(self, city_id: str) -> Optional[CityData]:
        return self._cities.get(city_id)

    def get_cities_by_faction(self, faction_id: str) -> List[CityData]:
        return [c for c in self._cities.values() if c.faction_id == faction_id]

    def assign_officer(self, city_id: str, officer_id: str) -> bool:
        city = self._cities.get(city_id)
        if not city:
            return False
        if officer_id not in city.officers:
            city.officers.append(officer_id)
        return True

    def remove_officer(self, city_id: str, officer_id: str) -> bool:
        city = self._cities.get(city_id)
        if not city or officer_id not in city.officers:
            return False
        city.officers.remove(officer_id)
        return True

    def build_facility(self, city_id: str, facility_type: FacilityType) -> bool:
        city = self._cities.get(city_id)
        if not city:
            return False
        key = facility_type.value
        if key in city.facilities:
            return False
        cost = 300
        if city.gold < cost:
            return False
        city.gold -= cost
        city.facilities[key] = FacilityData(type=facility_type)
        return True

    def upgrade_facility(self, city_id: str, facility_type: FacilityType) -> bool:
        city = self._cities.get(city_id)
        if not city:
            return False
        key = facility_type.value
        facility = city.facilities.get(key)
        if not facility or facility.level >= facility.max_level:
            return False
        cost = facility.upgrade_cost()
        if city.gold < cost:
            return False
        city.gold -= cost
        facility.level += 1
        return True

    def develop_commerce(self, city_id: str, investment: int) -> int:
        city = self._cities.get(city_id)
        if not city or city.gold < investment:
            return 0
        city.gold -= investment
        gain = investment // 10
        city.gold += gain
        return gain

    def develop_farming(self, city_id: str, investment: int) -> int:
        city = self._cities.get(city_id)
        if not city or city.gold < investment:
            return 0
        city.gold -= investment
        gain = investment // 8
        city.food += gain
        return gain

    def recruit_soldiers(self, city_id: str, gold_invest: int) -> int:
        city = self._cities.get(city_id)
        if not city or city.gold < gold_invest:
            return 0
        city.gold -= gold_invest
        recruits = gold_invest // 5
        max_soldiers = city.population // 2
        available = max_soldiers - city.soldiers
        if available <= 0:
            return 0
        actual = min(recruits, available)
        city.soldiers += actual
        city.riot_risk += 5  # [148] 징병 피로도 증가
        return actual

    def train_troops(self, city_id: str, investment: int) -> int:
        city = self._cities.get(city_id)
        if not city or city.gold < investment:
            return 0
        city.gold -= investment
        gain = investment // 20
        city.training = min(100, city.training + gain)
        return gain

    def build_defense(self, city_id: str, investment: int) -> int:
        city = self._cities.get(city_id)
        if not city or city.gold < investment:
            return 0
        city.gold -= investment
        gain = investment // 15
        city.defense += gain
        return gain

    def process_turn(self, city_id: str) -> Dict[str, Any]:
        city = self._cities.get(city_id)
        if not city:
            return {}

        report: Dict[str, Any] = {}

        pop_growth = max(1, city.population // 200)
        city.population += pop_growth
        report['pop_growth'] = pop_growth

        food_production = 100
        for f in city.facilities.values():
            if f.type == FacilityType.FARMLAND:
                food_production += f.effect_value() * 5
        city.food += food_production
        report['food_production'] = food_production

        gold_income = 50
        for f in city.facilities.values():
            if f.type == FacilityType.MARKET:
                gold_income += f.effect_value() * 3
        city.gold += gold_income
        report['gold_income'] = gold_income

        food_consumption = city.soldiers
        city.food -= food_consumption
        report['food_consumption'] = food_consumption

        if city.food < 0:
            city.food = 0
            starve_loss = city.soldiers // 20
            city.soldiers = max(0, city.soldiers - starve_loss)
            report['starve_loss'] = starve_loss

        return report

    def get_faction_gold(self, faction_id: str) -> int:
        return sum(c.gold for c in self._cities.values() if c.faction_id == faction_id)

    def get_faction_food(self, faction_id: str) -> int:
        return sum(c.food for c in self._cities.values() if c.faction_id == faction_id)

    def get_faction_soldiers(self, faction_id: str) -> int:
        return sum(c.soldiers for c in self._cities.values() if c.faction_id == faction_id)

    def process_all_cities_turn(self) -> Dict[str, Dict[str, Any]]:
        reports: Dict[str, Dict[str, Any]] = {}
        for city_id in self._cities:
            reports[city_id] = self.process_turn(city_id)
        return reports

    def process_all_cities_turn(self) -> Dict[str, Dict[str, Any]]:
        reports: Dict[str, Dict[str, Any]] = {}
        for city_id in self._cities:
            reports[city_id] = self.process_turn(city_id)
        return reports

    def get_faction_total_stats(self, faction_id: str) -> Dict[str, int]:
        cities = self.get_cities_by_faction(faction_id)
        return {
            'gold': sum(c.gold for c in cities),
            'food': sum(c.food for c in cities),
            'soldiers': sum(c.soldiers for c in cities),
            'population': sum(c.population for c in cities),
            'city_count': len(cities)
        }

    def integrate_with_graph(self, faction_id: str, graph_db: Any) -> None:
        cities = self.get_cities_by_faction(faction_id)
        total_power = sum(c.soldiers + c.defense for c in cities)
        for city in cities:
            for officer_id in city.officers:
                node = graph_db.node_store.get(officer_id)
                if node:
                    node.base_data['city_power'] = total_power

    def integrate_with_event_engine(self, city_id: str, event_engine: Any) -> List[Any]:
        city = self._cities.get(city_id)
        if not city:
            return []
        return event_engine.active_events

    def reset(self) -> None:
        self._cities.clear()