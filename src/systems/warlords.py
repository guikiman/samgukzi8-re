from __future__ import annotations
import datetime
from enum import Enum

class WarlordStatus(Enum):
    ALIVE = "alive"
    DETHRONED = "derowned"
    CAPTURED = "captured"
    DECEASED = "dead"

class WarlordNode:
    def __init__(self, uuid: str, name: str):
        self.uuid = uuid
        self.name = name
        self.title: str = ""
        self.base_faction_id: str = ""
        self.birthday: datetime.date = datetime.date.today()
        self.last_modified: datetime.datetime = datetime.datetime.now(datetime.timezone.utc)
        self.personality_type: str = "balanced"
        self.aggression_weight: float = 0.5
        self.defense_priority: float = 0.5
        self.status: WarlordStatus = WarlordStatus.ALIVE
    
    @property
    def age(self) -> int:
        return datetime.datetime.now().year - self.birthday.year
