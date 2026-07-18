"""
[Phase 19] 자연, 기후 및 지형의 물리 엔진화 — Climate Manager
파일: src/systems/climate_manager.py

설계 스펙:
- [321, 331] 국지성 기상 이변 관리
"""

from typing import Dict
from dataclasses import dataclass

@dataclass(slots=True)
class LocalClimate:
    region_id: str
    weather: str # RAIN, FOG, CLEAR
    temperature: int

class ClimateManager:
    def __init__(self):
        self.regions: Dict[str, LocalClimate] = {}

    def update_climate(self, region_id: str, new_weather: str) -> None:
        if region_id in self.regions:
            self.regions[region_id].weather = new_weather
