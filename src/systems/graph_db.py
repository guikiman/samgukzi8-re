"""
 삼국지 R Web - 고성능 메모리 내 그래프 데이터베이스 (Graph Database) 구현체
 파일: src/systems/graph_db.py

 설계 스펙 준수사항:
 [O(1) 해시맵 구조] → 정규화된 인덱싱 & O(1) 직접 접근 최적화
 [75% 인맥 필터링]   → 제한적 이웃 조회 (2 도 깊이, 80 명 최대) + 희소 행렬 압축
 [Ripple Effect]     → 가중치 기반 전파 연산 (+/-3 단계) 및 상태 지속 주기 관리

 Performance 목표:
 - 1,000 무장 노드 그래프 탐색 시간 < 5ms (해시맵 인덱싱 활용)
 - 메모리 사용량 최적화: 희소 행렬 & 정규화된 스토어 접근 패턴
"""

import time
from collections import defaultdict, deque, Counter
from typing import Dict, List, Set, Tuple, Optional, Union

# ============================================================================
# 1. 노드 레코딩 (Node Definition - O(1) 직접 접근용 해시맵 최적화의 핵심 구조체)
# ============================================================================

class WarlordNode: 
    """무장 객체를 표현하는 단일 노드 클래스"""
    
    def __init__(self, warlord_id: str):
        self.warlord_id = warlord_id
        
        # O(1) 해시맵 최적화를 위한 정규화 스토어
        self.base_data = {          
            'id': warlord_id,       
            'name': warlord_id,
            'name_idx': {},         
        }
        
        self.ability_stats = {       # 능력치 (4 항목) -> 직접 접근 최적화
            'STR': 0,               # 무력
            'DEF': 0,               # 통솔
            'INT': 0,               # 지력
            'POL': 0,               # 정치
        } 
        
        self.relationships = {       # 관계 그래프 (해시맵 기반 빠른 탐색) -> 인덱스 접근 O(1) 
            'enemies': set(),       
            'friends': {},         
            'subordinates': {}   
        }  
        
        self.reputation = 0         # 평판 점수 (-100 ~ +100)
        self.status_idx = 0         # 상태 플래그 인덱스


# ============================================================================
# 2. 에지 레코딩 및 희소 행렬 연산 (Edge Definition & Sparse Matrix - 가중치 압축 구조체)
# ============================================================================

class WarlordRelationshipEdge: 
    """무장간 관계를 표현하는 단일 관계 클래스"""
    
    def __init__(self, from_id: str, to_id: str, edge_type: str = 'neutral'):
        self.from_id = from_id   
        self.to_id = to_id            
        self.edge_type = edge_type    # 'enemy', 'friend', 'sworn_brother'
        self.weight = 0               # 우호도 가중치 (0 ~ 100 범위 제한)
        self.last_updated = time.time()     


# ============================================================================
# 3. 그래프 데이터베이스 메인 클래스 (High-Performance Graph DB 엔진)
# ============================================================================

class TriStateGraphDatabase: 
    """고성능 삼국지 인맥 네트워크를 관리하는 주된 그래프 객체"""
    
    def __init__(self):
        self.node_store: Dict[str, WarlordNode] = {}                  
        self.edge_store: Dict[Tuple[str, str], WarlordRelationshipEdge] = {}                
        self.adj_map: Dict[str, Set[str]] = defaultdict(set)  # 인접 목록 (O(1) 해시셋 탐색용)
        self.name_cache = {}          
        
        # 75% 인맥 네트워크 필터링 전략 (메모리 절감형 최대 이웃 제한 수)
        self.max_neighbors_per = 80   
        
    def add_warlord(self, warlord_id: str) -> WarlordNode:
        """새로운 무장 노드를 O(1) 속도로 추가합니다"""
        if warlord_id not in self.node_store:
            node = WarlordNode(warlord_id)
            self.node_store[warlord_id] = node
            return node
        return self.node_store[warlord_id]

    def set_relationship(self, from_id: str, to_id: str, weight: int, edge_type: str = 'friend'):
        """두 무장 간의 관계 에지(Edge)를 정규화하여 설정 (O(1))"""
        # 75% 인맥 필터링: 특정 장수의 인맥 개수가 임계치를 넘고 우호도가 낮으면 압축 탈락시킴
        if len(self.adj_map[from_id]) >= self.max_neighbors_per and weight < 75 and edge_type == 'friend':
            return # 희소 행렬 압축 법칙에 의해 트리에서 제외 (메모리 방어)

        self.add_warlord(from_id)
        self.add_warlord(to_id)

        edge_key = (from_id, to_id)
        edge = WarlordRelationshipEdge(from_id, to_id, edge_type)
        edge.weight = max(0, min(100, weight))
        
        self.edge_store[edge_key] = edge
        self.adj_map[from_id].add(to_id)

        # 노드 내부 빠른 참조 인덱스에 직접 바인딩 (O(1))
        node = self.node_store[from_id]
        if edge_type == 'enemy':
            node.relationships['enemies'].add(to_id)
        else:
            node.relationships['friends'][to_id] = edge.weight

    def get_relationship_weight(self, from_id: str, to_id: str) -> int:
        """두 무장 간의 우호도 수치를 고속 조회 (O(1))"""
        edge = self.edge_store.get((from_id, to_id))
        return edge.weight if edge else 0

    def apply_ripple_effect(self, target_id: str, source_id: str, change_amount: int, depth: int = 2):
        """
        [Ripple Effect - 인맥 파급 효과 핵심 알고리즘]
        source_id 무장이 target_id 무장에게 영향(참언, 증정 등)을 주었을 때,
        target_id 무장의 최측근(의형제/절친) 네트워크망을 최대 depth(2도경로)까지 탐색하여 
        감정 주기를 연쇄적으로 동적 전파(+/-3단계 가중치 감쇠)시킵니다.
        """
        if target_id not in self.node_store:
            return

        # BFS(너비 우선 탐색)를 활용한 2도 깊이 인맥망 추적
        queue = deque([(target_id, 1, change_amount)])
        visited = {target_id}

        print(f"[GraphDB-Ripple] {source_id}의 행동이 {target_id}의 인맥망에 파동을 일으킵니다 (초기값: {change_amount})")

        while queue:
            current_id, current_depth, current_change = queue.popleft()
            
            if current_depth > depth:
                continue

            # 현재 노드의 이웃(친구/의형제)들 스캔
            neighbors = self.adj_map[current_id]
            for neighbor_id in neighbors:
                if neighbor_id == source_id or neighbor_id in visited:
                    continue
                
                # 관계 밀도에 따른 감쇠 법칙 연산 (단계별 절반 감쇠)
                attenuated_change = current_change // 2
                if abs(attenuated_change) == 0:
                    continue

                visited.add(neighbor_id)
                
                # 최측근의 우호도 실시간 업데이트
                old_weight = self.get_relationship_weight(neighbor_id, source_id)
                new_weight = max(0, min(100, old_weight + attenuated_change))
                
                # 관계 데이터 인접 행렬 갱신
                self.set_relationship(neighbor_id, source_id, new_weight, 'enemy' if new_weight < 20 else 'friend')
                print(f"  -> 파급 전파 [{current_depth}도]: {neighbor_id}의 {source_id}에 대한 우호도가 {old_weight} -> {new_weight}로 변동")

                # 다음 깊이(2도) 인맥으로 파동 연쇄 전달
                queue.append((neighbor_id, current_depth + 1, attenuated_change))
