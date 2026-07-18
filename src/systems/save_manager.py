"""
[Phase 18] 세이브 데이터 관리 및 계승 — Save Manager
파일: src/systems/save_manager.py
"""

from typing import Dict, Any

class SaveManager:
    def __init__(self):
        self.inheritance_points: int = 0

    def apply_clear_rewards(self, ending_id: str) -> None:
        if ending_id == "unification":
            self.inheritance_points += 500
