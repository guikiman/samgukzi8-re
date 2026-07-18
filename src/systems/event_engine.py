"""
[Phase 4] 연의전 이벤트 트리거 및 조건 검사기 — Event Chain Queue Manager & Condition Evaluator
파일: src/systems/event_engine.py

설계 스펙:
- [300] Event 체인 큐(Queue) 관리자: O(1) 스캔, 중복 방지, 연쇄 이벤트 활성화
- 수백 개의 연의전 조건(연도, 무장 생존, 소속 세력, 위치, 우호도)을 병목 없이 스캔
- graph_db.py의 TriStateGraphDatabase와 연동하여 무장 관계망 기반 조건 평가
- scenario_engine.py의 ScenarioManager와 연동하여 시나리오별 이벤트 활성화
"""

from __future__ import annotations
from typing import Any, Callable
from dataclasses import dataclass, field
from enum import Enum

# ============================================================================
# 1. 이벤트 조건 타입 및 노드 정의
# ============================================================================

class ConditionType(Enum):
    YEAR = "year"
    WARLORD_ALIVE = "warlord_alive"
    WARLORD_DEAD = "warlord_dead"
    FACTION = "faction"
    CITY_OWNER = "city_owner"
    AFFINITY = "affinity"
    LOCATION = "location"
    TURN_COUNT = "turn_count"
    RANDOM = "random"
    AND = "and"
    OR = "or"

@dataclass(slots=True)
class EventCondition:
    type: ConditionType
    target_id: str | None = None
    target_faction: str | None = None
    target_city: str | None = None
    min_value: int | None = None
    max_value: int | None = None
    probability: float | None = None

    def to_dict(self) -> dict:
        return {
            'type': self.type.value,
            'target_id': self.target_id,
            'target_faction': self.target_faction,
            'target_city': self.target_city,
            'min_value': self.min_value,
            'max_value': self.max_value,
            'probability': self.probability
        }

@dataclass(slots=True)
class EventResult:
    event_id: str
    event_name: str
    event_type: str
    dialogue_lines: list[str] = field(default_factory=list)
    rewards: dict[str, Any] = field(default_factory=dict)
    next_event_id: str | None = None

    def to_dict(self) -> dict:
        return {
            'event_id': self.event_id,
            'event_name': self.event_name,
            'event_type': self.event_type,
            'dialogue_lines': self.dialogue_lines,
            'rewards': self.rewards,
            'next_event_id': self.next_event_id
        }

@dataclass(slots=True)
class EventChainNode:
    event_id: str
    event_name: str
    conditions: list[EventCondition]
    result: EventResult
    chain_next_id: str | None = None
    priority: int = 0

    def to_dict(self) -> dict:
        return {
            'event_id': self.event_id,
            'event_name': self.event_name,
            'conditions': [c.to_dict() for c in self.conditions],
            'result': self.result.to_dict(),
            'chain_next_id': self.chain_next_id,
            'priority': self.priority
        }

class EventChainQueueManager:
    def __init__(self):
        self._queue: list[EventChainNode] = []
        self._processed: set[str] = set()
        self._chain_map: dict[str, list[EventChainNode]] = {}

    @property
    def queue_size(self) -> int:
        return len(self._queue)

    def enqueue(self, node: EventChainNode) -> None:
        if node.event_id not in self._processed:
            self._queue.append(node)
            self._processed.add(node.event_id)

    def enqueue_chain(self, chain_id: str, nodes: list[EventChainNode]) -> None:
        self._chain_map[chain_id] = nodes
        for node in nodes:
            if node.event_id not in self._processed:
                self._queue.append(node)

    def dequeue(self) -> EventChainNode | None:
        return self._queue.pop(0) if self._queue else None

    def dequeue_by_priority(self) -> EventChainNode | None:
        if not self._queue:
            return None
        max_idx = max(range(len(self._queue)), key=lambda i: self._queue[i].priority)
        return self._queue.pop(max_idx)

    def is_processed(self, node: EventChainNode) -> bool:
        return node.event_id in self._processed

    def mark_processed(self, event_id: str) -> None:
        self._processed.add(event_id)

    def get_chain(self, chain_id: str) -> list[EventChainNode]:
        return self._chain_map.get(chain_id, [])

    def get_next_in_chain(self, current_event_id: str) -> EventChainNode | None:
        for chain_nodes in self._chain_map.values():
            for i, node in enumerate(chain_nodes):
                if node.event_id == current_event_id and i + 1 < len(chain_nodes):
                    return chain_nodes[i + 1]
        return None

    def clear_processed(self) -> None:
        self._queue = [n for n in self._queue if n.event_id not in self._processed]

    def reset(self) -> None:
        self._queue.clear()
        self._processed.clear()
        self._chain_map.clear()

class WarlordConditionEvaluator:
    def __init__(self, warlords: dict[str, dict[str, Any]],
                 graph_db: Any | None = None):
        self.warlords = warlords
        self.graph_db = graph_db

    def evaluate_condition(self, cond: EventCondition, current_year: int,
                           current_turn: int, game_rng: Callable[[], float] | None = None) -> bool:
        if cond.type == ConditionType.YEAR:
            if cond.min_value is not None and current_year < cond.min_value:
                return False
            if cond.max_value is not None and current_year > cond.max_value:
                return False
            return True

        if cond.type == ConditionType.TURN_COUNT:
            if cond.min_value is not None and current_turn < cond.min_value:
                return False
            if cond.max_value is not None and current_turn > cond.max_value:
                return False
            return True

        if cond.type == ConditionType.WARLORD_ALIVE:
            target = self.warlords.get(cond.target_id or "")
            return target is not None and target.get("status", "alive") == "alive"

        if cond.type == ConditionType.WARLORD_DEAD:
            target = self.warlords.get(cond.target_id or "")
            return target is None or target.get("status", "alive") == "dead"

        if cond.type == ConditionType.FACTION:
            target = self.warlords.get(cond.target_id or "")
            if not target:
                return False
            return target.get("faction_id") == cond.target_faction

        if cond.type == ConditionType.CITY_OWNER:
            target = self.warlords.get(cond.target_id or "")
            if not target:
                return False
            return target.get("city_id") == cond.target_city

        if cond.type == ConditionType.AFFINITY:
            target = self.warlords.get(cond.target_id or "")
            if not target:
                return False
            affinity = target.get("affinity", 0)
            if cond.min_value is not None and affinity < cond.min_value:
                return False
            if cond.max_value is not None and affinity > cond.max_value:
                return False
            return True

        if cond.type == ConditionType.RANDOM:
            rng = game_rng if game_rng else __import__('random').random
            return rng() < (cond.probability or 0.5)

        return False

    def evaluate_multi(self, conditions: list[EventCondition], current_year: int,
                       logic: str = "and", **kwargs) -> bool:
        if not conditions:
            return True

        results = [self.evaluate_condition(c, current_year, **kwargs) for c in conditions]

        if logic == "and":
            return all(results)
        elif logic == "or":
            return any(results)
        return all(results)

    def evaluate(self, node: EventChainNode, current_year: int, **kwargs) -> bool:
        if not node.conditions:
            return True

        if len(node.conditions) == 1:
            return self.evaluate_condition(node.conditions[0], current_year, **kwargs)

        return all(self.evaluate_condition(c, current_year, **kwargs) for c in node.conditions)

class EventEngine:
    def __init__(self, queue_mgr: EventChainQueueManager, evaluator: WarlordConditionEvaluator):
        self.queue_mgr = queue_mgr
        self.evaluator = evaluator
        self.active_events: list[EventChainNode] = []
        self._turn_count: int = 0

    def scan_and_activate(self, current_year: int) -> list[EventChainNode]:
        activated: list[EventChainNode] = []
        remaining: list[EventChainNode] = []

        while self.queue_mgr.queue_size > 0:
            node = self.queue_mgr.dequeue()
            if node is None:
                break
            if self.evaluator.evaluate(node, current_year):
                activated.append(node)
                self.queue_mgr.mark_processed(node.event_id)
            else:
                remaining.append(node)

        for node in remaining:
            self.queue_mgr.enqueue(node)

        self.active_events = activated
        return activated

    def get_next_chain_event(self, current_event_id: str) -> EventChainNode | None:
        return self.queue_mgr.get_next_in_chain(current_event_id)

    def reset(self) -> None:
        self.queue_mgr.reset()
        self.active_events.clear()

