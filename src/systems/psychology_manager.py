"""
[Phase 22] 궁중 암투와 심층 심리학 — Psychology Manager
파일: src/systems/psychology_manager.py

설계 스펙:
- [381] 번아웃
- [382] 편집증(의심병)
- [389] 트라우마 관리
"""

from typing import Dict

class PsychologyManager:
    def __init__(self):
        self.burnout: Dict[str, int] = {}
        self.paranoia: Dict[str, int] = {}
        self.trauma: Dict[str, bool] = {}

    def add_burnout(self, officer_id: str, amount: int) -> None:
        self.burnout[officer_id] = min(100, self.burnout.get(officer_id, 0) + amount)

    def trigger_paranoia(self, officer_id: str) -> None:
        self.paranoia[officer_id] = min(100, self.paranoia.get(officer_id, 0) + 20)
