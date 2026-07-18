"""
[Phase 21] 거시 경제 및 마이크로컨트롤
파일: src/systems/macro_economy.py
"""

from typing import Dict

class MacroEconomyManager:
    def __init__(self):
        self.inflation_factor = 1.0
        self.monopoly_cities: Dict[str, str] = {}
        self.corruption_rates: Dict[str, float] = {}

    def mint_money(self, amount: int) -> None:
        self.inflation_factor += (amount / 10000)

    def set_monopoly(self, city_id: str, resource_id: str) -> None:
        self.monopoly_cities[city_id] = resource_id

    def detect_corruption(self, city_id: str, inspector_politics: int) -> bool:
        return inspector_politics > (self.corruption_rates.get(city_id, 0.1) * 100)
