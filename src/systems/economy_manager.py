"""
[Phase 13] 내정, 외교, 경제의 현실성 — Economy Manager
파일: src/systems/economy_manager.py

설계 스펙:
- [146] 지역 교역로 시너지
- [147] 인플레이션/디플레이션 (상인 경제)
- [158] 대상인 차용금 시스템
"""

from typing import Dict, List

class EconomyManager:
    def __init__(self):
        self.inflation_rate = 1.0
        self.loans: Dict[str, int] = {}

    def get_market_price(self, base_price: int) -> int:
        return int(base_price * self.inflation_rate)

    def borrow_money(self, warlord_id: str, amount: int) -> int:
        self.loans[warlord_id] = int(amount * 1.2)
        return amount

    def hold_festival(self, city_id: str, cost: int) -> None:
        # [365] 축제 개최: 민심 상승
        pass
    
    def levy_tax(self, city_id: str) -> None:
        # [370] 징발(약탈적 세금): 악명 증가, 금 확보
        pass
