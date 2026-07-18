"""
[Phase 25] 메타 데이터 관리자
파일: src/systems/meta_data_manager.py

설계 스펙:
- [445] 세력 이름 변경
- [456] 무기 수식어 부여
"""

from typing import Dict

class MetaDataManager:
    def __init__(self):
        self.faction_names: Dict[str, str] = {}
        self.weapon_modifiers: Dict[str, str] = {}

    def set_faction_name(self, faction_id: str, name: str) -> None:
        self.faction_names[faction_id] = name
    
    def apply_weapon_modifier(self, weapon_id: str, modifier: str) -> None:
        self.weapon_modifiers[weapon_id] = modifier
