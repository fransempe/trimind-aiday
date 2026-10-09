from app.agents.base import Specialist
from app.agents.performance import PerformanceAgent
from app.agents.race import RaceAgent
from app.agents.recovery import RecoveryAgent
from app.agents.training import TrainingAgent

# Para sumar un especialista (ej. Nutrition): crear el archivo y agregarlo acá.
REGISTRY: dict[str, Specialist] = {
    a.name: a for a in (TrainingAgent(), RecoveryAgent(), RaceAgent(), PerformanceAgent())
}
