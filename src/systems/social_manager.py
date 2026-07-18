"""
[Phase 14] 인간관계 및 소셜 인터랙션 — Social Manager
파일: src/systems/social_manager.py

설계 스펙:
- [161] 다중 의형제 그룹화: 관계 노드 계층화
- [168] 성격 기반 스트레스 시스템: Personality 기반 스트레스 증가 로직
"""

from __future__ import annotations
from typing import Set
from dataclasses import dataclass, field

@dataclass(slots=True)
class SocialGroup:
    group_id: str
    members: Set[str]
    group_type: str

class SocialManager:
    def __init__(self):
        self.stress_levels: dict[str, int] = {}
        self.social_groups: dict[str, SocialGroup] = {}

    def update_stress(self, warlord_id: str, amount: int) -> int:
        self.stress_levels[warlord_id] = min(100, self.stress_levels.get(warlord_id, 0) + amount)
        return self.stress_levels[warlord_id]
