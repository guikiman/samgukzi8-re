"""
[Phase 9] 연의전 사실/가상 분기 관리자 — Scenario Branch Manager
파일: src/systems/scenario_branch_manager.py

설계 스펙:
- [106-114] 연의전 분기 시스템
- 사실(Historical) 및 가상(Fictional) 경로 관리
- 이벤트 체인 노드(EventChainNode) 그룹화 및 선택적 트리거
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
from event_engine import EventChainNode

class BranchType(Enum):
    HISTORICAL = "historical"
    FICTIONAL = "fictional"

@dataclass(slots=True)
class ScenarioBranch:
    branch_id: str
    branch_type: BranchType
    condition_id: str  # 이 분기가 활성화되기 위한 조건 ID
    nodes: List[EventChainNode]

class ScenarioBranchManager:
    def __init__(self):
        self.branches: Dict[str, ScenarioBranch] = {}
        self.active_branch_id: Optional[str] = None

    def register_branch(self, branch: ScenarioBranch) -> None:
        self.branches[branch.branch_id] = branch

    def select_branch(self, branch_id: str) -> bool:
        if branch_id in self.branches:
            self.active_branch_id = branch_id
            return True
        return False

    def activate_branch(self, branch_id: str, event_engine: Any) -> bool:
        if not self.select_branch(branch_id):
            return False
        
        branch = self.branches[branch_id]
        event_engine.queue_mgr.enqueue_chain(branch_id, branch.nodes)
        return True

class SpecialEventTrigger:
    def __init__(self, event_engine: Any):
        self.event_engine = event_engine

    def trigger_special_event(self, event_type: str, target_id: str) -> None:
        # 황제 즉위, 질병, 재해 등 즉시 활성화 트리거
        pass
