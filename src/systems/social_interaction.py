"""
[Phase 14] 소셜 인터랙션 및 복수 시스템
파일: src/systems/social_interaction.py
"""

from __future__ import annotations

class SocialInteractionManager:
    def __init__(self):
        self.enmities: dict[str, list[str]] = {}

    def add_enmity(self, target_id: str, enemy_id: str) -> None:
        if target_id not in self.enmities:
            self.enmities[target_id] = []
        self.enmities[target_id].append(enemy_id)
