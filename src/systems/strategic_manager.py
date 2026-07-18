"""
[Phase 7] 평정 및 군단 시스템 — Strategic Command & Army Manager
파일: src/systems/strategic_manager.py

설계 스펙:
- [76-79] 평정, 출진 명령, 수송, 군단 편제
- [80-82] 위임 방침, 영지 변경, 명령 거부
- [83-85] 방랑군 해산, 방해/요격, 병종 편제
"""

from __future__ import annotations
from typing import Any
from dataclasses import dataclass, field
from enum import Enum

class StrategicPolicy(Enum):
    CONQUEST = "conquest"
    DOMINATION = "domination"
    DEFENSE = "defense"
    SUPPLY_PRIO = "supply_prio"

@dataclass(slots=True)
class ArmyUnit:
    leader_id: str
    officer_ids: list[str]
    soldiers: int
    training: int
    morale: int
    formation: str = "basic"

@dataclass(slots=True)
class StrategicCommandManager:
    faction_id: str
    strategy_points: int = 100
    delegation_policies: dict[str, StrategicPolicy] = field(default_factory=dict)
    
    def consume_points(self, amount: int) -> bool:
        if self.strategy_points >= amount:
            self.strategy_points -= amount
            return True
        return False

    def order_campaign(self, city_id: str, army: ArmyUnit, target_city: str) -> bool:
        if not self.consume_points(20):
            return False
        return True

    def order_transport(self, from_city: str, to_city: str, 
                        gold: int, food: int, soldiers: int) -> bool:
        if not self.consume_points(10):
            return False
        return True

    def set_delegation_policy(self, viceroy_id: str, policy: StrategicPolicy, diplomacy_mgr: Any) -> None:
        self.delegation_policies[viceroy_id] = policy
        if hasattr(diplomacy_mgr, 'set_faction_policy'):
             diplomacy_mgr.set_faction_policy(self.faction_id, viceroy_id, policy.value)

    def process_turn(self) -> None:
        self.strategy_points = min(100, self.strategy_points + 20)
