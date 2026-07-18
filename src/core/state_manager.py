from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import json

@dataclass
class BaseState(ABC):
    """Base class for all game states in the SamGukZi 8 Remake."""
    state_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @abstractmethod
    def transition_to(self, next_state_id: str) -> 'BaseState':
        """Define logic for transitioning to a different game state."""
        pass

class WorldMapState(BaseState):
    """The primary exploration/movement state."""
    def transition_to(self, next_state_id: str) -> BaseState:
        # Logic to be implemented by ScenarioEngine based on triggers
        return self @abstractmethod # Placeholder for dynamic logic

class BattleState(BaseState):
    """The combat management state (Hex-based or Turn-based)."""
    def transition_to(self, next_state_id: str) -> BaseState:
        # Logic to be implemented by CombatEngine
        pass

class DialogueState(BaseState):
    """Event-driven dialogue/scenario interaction."""
    def transition_to(self, next_state_id: str) -> BaseState:
        pass

class GlobalStateManager:
    """Singleton manager for managing global game state transitions and history."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GlobalStateManager, cls).__new__(cls)
            cls._instance.current_state: Optional[BaseState] = None
            cls._instance.state_history = []
            cls._instance.global_data: Dict[str, Any] = {}
        return cls._instance

    def set_initial_state(self, initial_state: BaseState):
        """Initialize the game state (e.g., Title Screen -> World Map)."""
        self.current_state = initial_state
        self.state_history.append(initial_state)
        print(f"[StateManager] Initialized with: {initial_state.state_id}")

    def transition(self, next_state_id: str) -> BaseState:
        """Perform a state transition."""
        if self.current_state:
            # This would typically be mapped in an Engine/Scenario manager
            print(f"[StateManager] Transitioning from {self.current_state.state_id} to {next_state_id}")
            # Mock implementation: In a full system, this grabs the concrete class
            # For now, we placeholder with a generic transition logic or specific classes
            pass 
        return None

    def get_data(self) -> Dict[str, Any]:
        """Retrieve current global data."""
        return self.global_data

# Singleton Instance
state_manager = GlobalStateManager()
