"""
[Phase 11] 고급 AI 및 NPC 행동 패턴 — AI Strategy Manager
파일: src/systems/ai_strategy_manager.py
"""

from typing import Dict, Any, List

class AIStrategyManager:
    def __init__(self, warlords: Dict[str, Any], cities: Dict[str, Any], graph_db: Any = None):
        self.warlords = warlords
        self.cities = cities
        self.graph_db = graph_db

    def get_action(self, warlord_id: str) -> Dict[str, Any]:
        warlord = self.warlords.get(warlord_id)
        if not warlord: return {'action': 'INTERNAL_DEVELOP'}
        
        # 1. 원수 기반 타겟팅 (123)
        target_id = self.get_target_preference(warlord_id)
        if target_id:
            return {'action': 'ATTACK', 'target_id': target_id}
            
        aggression = warlord.get('aggression_weight', 0.5)
        
        city = self.cities.get(warlord.get('city_id', ''))
        if city and city.get('defense', 100) < 50:
             return {'action': 'BUILD_DEFENSE'}

        if aggression > 0.7:
             return {'action': 'MILITARY_DRAFT'}
             
        return {'action': 'INTERNAL_DEVELOP'}

    def calculate_migration(self, warlord_id: str) -> Optional[str]:
        # 가장 인구 밀도가 높은 도시를 재야 무장이 선호함
        best_city = max(self.cities.values(), key=lambda c: c.get('population', 0), default=None)
        return best_city.get('city_id') if best_city else None
