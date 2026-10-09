"""Estado del atleta en memoria para la demo (escenario + cambios del formulario)."""

from app.models.api import AthleteStateUpdate, FeedbackRequest
from app.models.metrics import AthleteSnapshot
from app.repositories.mock import AthleteData, apply_state_update, load_athlete_data
from app.tools.snapshot import build_snapshot


class AthleteState:
    def __init__(self, scenario: str = "normal") -> None:
        self.feedback: list[FeedbackRequest] = []
        self.set_scenario(scenario)

    def set_scenario(self, name: str) -> None:
        self.scenario = name
        self.data: AthleteData = load_athlete_data(name)

    def update(self, update: AthleteStateUpdate) -> None:
        if update.hard_run_yesterday is not None:
            # La historia sale del escenario con o sin run fuerte ayer.
            source = load_athlete_data(
                "fatigued" if update.hard_run_yesterday else "normal", today=self.data.today
            )
            self.data = self.data.model_copy(update={"activities": source.activities})
        self.data = apply_state_update(self.data, update)

    def snapshot(self) -> AthleteSnapshot:
        return build_snapshot(self.data)
