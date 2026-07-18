"""
[Phase 18] 메타 게임 시스템 — Meta Manager
파일: src/systems/meta_manager.py

설계 스펙:
- [213] 업적 시스템
- [214] 멀티 엔딩 시스템
"""

from typing import Dict, Set

class MetaManager:
    def __init__(self):
        self.achievements: Set[str] = set()
        self.completed_endings: Set[str] = set()

    def unlock_achievement(self, achievement_id: str) -> None:
        self.achievements.add(achievement_id)

    def trigger_ending(self, ending_id: str) -> None:
        self.completed_endings.add(ending_id)
