from typing import Literal

from pydantic import BaseModel, computed_field

RuleId = Literal["red_readiness_high_intensity", "vo2max_race_week", "medical_tone"]


class RuleViolation(BaseModel):
    rule_id: RuleId
    message: str


class RulesResult(BaseModel):
    violations: list[RuleViolation] = []

    @computed_field
    @property
    def passed(self) -> bool:
        return not self.violations
