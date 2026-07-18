"""
[Phase 24] 가문 및 상속 시스템 — Legacy Manager
파일: src/systems/legacy_manager.py

설계 스펙:
- [431] 가보 상속
- [432] 사생아/자녀 관계
"""

from typing import Dict

class LegacyManager:
    def __init__(self):
        self.heirlooms: Dict[str, str] = {}

    def inherit_heirloom(self, old_owner_id: str, new_owner_id: str) -> None:
        if old_owner_id in self.heirlooms:
            self.heirlooms[new_owner_id] = self.heirlooms.pop(old_owner_id)
