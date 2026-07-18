"""
[Phase 12] 전술 및 특수 무기 엔진 — Battle Tactics Engine
파일: src/systems/battle_tactics.py
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

class TacticsType(Enum):
    SIEGE_RAM = "siege_ram"         # 충차
    CATAPULT = "catapult"           # 투석기
    TRAP_FIRE = "trap_fire"         # 화약통 함정

@dataclass(slots=True)
class TacticsData:
    tactics_id: str
    tactic_type: TacticsType
    damage: int

class BattleTactics:
    def __init__(self):
        self.active_tactics: List[TacticsData] = []

    def trigger_trap(self, trap_type: TacticsType, target_id: str) -> int:
        # 함정 연쇄 메커니즘
        damage = 100 if trap_type == TacticsType.TRAP_FIRE else 50
        return damage

    def use_siege_weapon(self, weapon_type: TacticsType, target: str) -> int:
        if weapon_type == TacticsType.CATAPULT:
            return 250
        elif weapon_type == TacticsType.SIEGE_RAM:
            return 150
        return 100

    def start_tunneling(self, city_id: str, days: int) -> None:
        # [404] 땅굴 작업(Sapping)
        pass
