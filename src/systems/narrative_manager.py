"""
[Phase 25] 동적 내러티브 — Narrative Manager
파일: src/systems/narrative_manager.py

설계 스펙:
- [441] 절차적 사기(史記) 생성
- [442] 나비효과 트래커
"""

from typing import Dict, List

class NarrativeManager:
    def __init__(self):
        self.history_records: List[str] = []
        self.butterfly_effects: Dict[str, str] = {}

    def record_event(self, event_description: str) -> None:
        self.history_records.append(event_description)

    def track_butterfly_effect(self, cause: str, effect: str) -> None:
        self.butterfly_effects[cause] = effect
