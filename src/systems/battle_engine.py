from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
from pathfinding import PathfindingEngine, HexTile

class TerrainType(Enum):
    PLAIN = "plain"
    MOUNTAIN = "mountain"
    RIVER = "river"
    FOREST = "forest"

@dataclass(slots=True)
class BattlefieldTile:
    x: int
    y: int
    terrain: TerrainType
    defense: int = 0
    structure: Optional[str] = None

@dataclass(slots=True)
class BattleUnit:
    unit_id: str
    officer_id: str
    soldiers: int
    morale: int
    training: int
    position: Tuple[int, int]
    direction: int = 0
    is_supplied: bool = True

class BattleEngine:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.tiles: Dict[Tuple[int, int], BattlefieldTile] = {}
        self.units: Dict[str, BattleUnit] = {}
        self.turn: int = 0
        self.active: bool = False

    def add_unit(self, unit: BattleUnit) -> None:
        self.units[unit.unit_id] = unit

    def get_tile(self, pos: Tuple[int, int]) -> Optional[BattlefieldTile]:
        return self.tiles.get(pos)

    def move_unit(self, unit_id: str, new_pos: Tuple[int, int], 
                  pathfinder: PathfindingEngine, enemy_positions: Set[Tuple[int, int]]) -> bool:
        unit = self.units.get(unit_id)
        if not unit:
            return False
            
        grid_map = {pos: HexTile(pos[0], pos[1], t.terrain.value) 
                    for pos, t in self.tiles.items()}
        
        path = pathfinder.search_path(unit.position, new_pos, "HEAVY_CAVALRY", 
                                      grid_map, enemy_positions)
        
        if not path:
            return False
            
        unit.position = new_pos
        return True

    def check_unit_supply(self, unit_id: str, capital_pos: Tuple[int, int],
                          pathfinder: PathfindingEngine, enemy_positions: Set[Tuple[int, int]]) -> bool:
        unit = self.units.get(unit_id)
        if not unit:
            return False
        
        grid_map = {pos: HexTile(pos[0], pos[1], t.terrain.value) 
                    for pos, t in self.tiles.items()}
                    
        return pathfinder.calculate_supply_line(unit.position, capital_pos, grid_map, enemy_positions)

    def calculate_damage(self, attacker: BattleUnit, defender: BattleUnit, 
                         at_tile: BattlefieldTile, de_tile: BattlefieldTile) -> int:
        base_dmg = attacker.soldiers // 10
        
        # 고저차 보정 (공격자가 고지대에 있을 경우 데미지 증가)
        elevation_bonus = 1.2 if at_tile.terrain == TerrainType.MOUNTAIN and de_tile.terrain != TerrainType.MOUNTAIN else 1.0
        
        return int(base_dmg * elevation_bonus)

    def process_turn(self, capital_pos: Tuple[int, int], 
                     pathfinder: PathfindingEngine, enemy_positions: Set[Tuple[int, int]]) -> None:
        self.turn += 1
        for unit in self.units.values():
            unit.is_supplied = self.check_unit_supply(unit.unit_id, capital_pos, pathfinder, enemy_positions)
            if not unit.is_supplied:
                unit.morale = max(0, unit.morale - 10)

    def execute_tactical_bonus(self, unit_id: str, bonus_type: str) -> None:
        # [412, 416, 417, 418, 420] 부대 분할, 포위, 기치 탈취, 호위, 예비대
        pass

