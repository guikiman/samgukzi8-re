"""
[Phase 22] 파벌 및 갈등 관리 — Faction Manager
파일: src/systems/faction_manager.py

설계 스펙:
- [383] 파벌 갈등 (구신 vs 신진)
- [385] 낙하산 인사 불만
"""

from typing import Dict, Set, Tuple

class FactionManager:
    def __init__(self):
        self.cliques: Dict[str, Set[str]] = {}
        self.rivalry_levels: Dict[Tuple[str, str], int] = {}

    def manage_clique_rivalry(self, clique_a: str, clique_b: str, conflict: int) -> None:
        key = tuple(sorted([clique_a, clique_b]))
        self.rivalry_levels[key] = self.rivalry_levels.get(key, 0) + conflict
