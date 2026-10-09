from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import Recommendation, Sport

Meal = Literal["desayuno", "almuerzo", "merienda", "cena"]
# Condiciones alimentarias que adaptan el plan (no es indicación médica).
Condition = Literal["celiaquia", "lactosa", "diabetes", "vegetariano"]


class PlannedSession(BaseModel):
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    sport: Sport
    title: str
    minutes: float = Field(ge=0)
    key: bool = False
    intense: bool = False


class StaffNote(BaseModel):
    """Lo que dijo otro agente del staff: el nutricionista lo usa como entrada."""

    agent: str
    recommendation: Recommendation
    observations: list[str] = Field(default_factory=list)


class MealPlanRequest(BaseModel):
    weight_kg: float = Field(gt=30, lt=200)
    sessions: list[PlannedSession] = Field(default_factory=list)
    # Decisión del Head Coach y opiniones de la última corrida, si la hubo. Si no vienen, el
    # nutricionista consulta en el momento a Recovery y Training.
    decision: Recommendation | None = None
    primary_reason: str | None = None
    staff: list[StaffNote] = Field(default_factory=list)
    conditions: list[Condition] = Field(default_factory=list)


class MealDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    meal: Meal
    foods: list[str] = Field(min_length=2, max_length=5)
    note: str


class MealPlanDraft(BaseModel):
    """Lo que devuelve el LLM: alimentos y textos. Los gramos ya vienen calculados."""

    model_config = ConfigDict(extra="forbid")

    meals: list[MealDraft] = Field(min_length=4, max_length=4)
    coordination: list[str] = Field(min_length=1, max_length=4)
    tips: list[str] = Field(min_length=1, max_length=3)


class MealTargets(BaseModel):
    meal: Meal
    when: str
    carbs_g: int
    protein_g: int


class PlannedMeal(MealTargets):
    foods: list[str]
    note: str


class MealPlan(BaseModel):
    level: str
    label: str
    reason: str
    carbs_g: tuple[int, int]
    protein_g: tuple[int, int]
    meals: list[PlannedMeal]
    coordination: list[str]
    tips: list[str]
    consulted: list[StaffNote]
    conditions: list[Condition] = Field(default_factory=list)
    model: str = ""
