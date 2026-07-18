import json
import yaml
import os
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field, asdict
from enum import Enum

class ScenarioStatus(Enum):
    LOCKED = "locked"           # 진행 불가 상태
    ACTIVE = "active"           # 현재 진행 중인 시나리오
    COMPLETED = "completed"     # 완료된 시나리오
    FAILED = "failed"           # 실패/중단된 시나리오

@dataclass
class ScenarioData:
    """기획서 기반의 개별 시나리오 데이터 구조"""
    id: str                      # 고유 번호 (예: 01, 02)
    title_kr: str                # 한국어 제목
    title_en: str                # 영문 제목
    start_date: str              # 시작 연월 (예: 184-01)
    description: str             # 시나리오 배경 설명
    difficulty: int              # 난이도 (1-5)
    factions: List[Dict] = field(default_factory=list) # 등장 세력 정보
    special_conditions: Dict = field(default_factory=dict) # 발생/승리 조건
    status: ScenarioStatus = ScenarioStatus.LOCKED

class ScenarioManager:
    """시나리오 로딩 및 상태 관리 엔진"""
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.scenarios: Dict[str, ScenarioData] = {}
        self.active_scenario_id: Optional[str] = None

    def load_all_scenarios(self):
        """지정된 폴더에서 모든 JSON 시나리오 파일을 로드"""
        if not os.path.exists(self.data_path):
            os.makedirs(self.data_path)
            return

        for file_name in os.listdir(self.data_path):
            if file_name.endswith('.json'):
                path = os.path.join(self.data_path, file_name)
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    scenario = ScenarioData(**data)
                    self.scenarios[scenarioid] = scenario
        
        print(f"총 {len(self.scenarios)}개의 시나리오가 로드되었습니다.")

    def get_scenario(self, scenario_id: str) -> Optional[ScenarioData]:
        return self.scenarios.get(scenario_id)

    def set_active_scenario(self, scenario_id: str):
        if scenario_id in self.scenarios:
            self.active_scenario_id = scenario_id
            self.scenarios[scenario_id].status = ScenarioStatus.ACTIVE
            print(f"시나리오 '{self.scenarios[scenario_id].title_kr}'가 활성화되었습니다.")

    def trigger_random_encounter(self, city_id: str) -> Dict[str, Any]:
        # [443, 451, 455] 랜덤 이벤트 트리거 (도시 괴담, 다크 퀘스트 등)
        return {"event": "random_encounter", "type": "ghost"}
