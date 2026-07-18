"""
[Phase 10] UI/UX 폴리싱 및 편의성 극대화 — UI Manager
파일: src/systems/ui_manager.py

설계 스펙:
- [117] 다이얼로그 및 로그 시스템: 시스템 메시지 스택 관리
- [120] 툴팁 관리: 데이터 구조 정의
"""

from __future__ import annotations
from typing import Any
from dataclasses import dataclass, field

@dataclass(slots=True)
class TooltipData:
    title: str
    content: str
    target_id: str

class UIManager:
    def __init__(self):
        self.log_history: list[str] = []
        self.active_dialogue: str | None = None
        self.tooltips: dict[str, TooltipData] = {}
        self.is_loading: bool = False
        self.current_bgm: str | None = None
        self.pinned_warlords: set[str] = set()

    def add_log(self, message: str) -> None:
        self.log_history.append(message)
        if len(self.log_history) > 100:
            self.log_history.pop(0)

    def set_dialogue(self, message: str) -> None:
        self.active_dialogue = message

    def register_tooltip(self, target_id: str, title: str, content: str) -> None:
        self.tooltips[target_id] = TooltipData(title, content, target_id)

    def set_loading(self, is_loading: bool) -> None:
        self.is_loading = is_loading

    def set_bgm(self, track_name: str, volume: float = 1.0) -> None:
        self.current_bgm = track_name

    def toggle_pin(self, warlord_id: str) -> None:
        if warlord_id in self.pinned_warlords:
            self.pinned_warlords.remove(warlord_id)
        else:
            self.pinned_warlords.add(warlord_id)

    @staticmethod
    def format_number(num: int) -> str:
        if num >= 10000:
            return f"{num // 1000}K"
        return str(num)
