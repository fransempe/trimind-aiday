from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ResultSource = Literal["garmin", "strava", "wahoo", "manual"]


class SegmentResult(BaseModel):
    label: str
    sport: Literal["swim", "bike", "run"]
    distance_km: float = Field(gt=0)
    time_s: int = Field(gt=0)


class RaceDebriefRequest(BaseModel):
    race_name: str
    distance: str
    days_ago: int = Field(ge=0)
    source: ResultSource
    segments: list[SegmentResult] = Field(min_length=1)
    transitions_s: int = Field(default=0, ge=0)
    brief: str = ""


class SegmentStat(SegmentResult):
    """Ritmo o velocidad calculados en código para cada segmento."""

    pace: str


class RaceDebriefDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str
    highlights: list[str] = Field(min_length=1, max_length=4)
    improvements: list[str] = Field(min_length=1, max_length=4)
    insights: list[str] = Field(min_length=1, max_length=3)


class RaceDebrief(RaceDebriefDraft):
    race_name: str
    total_s: int
    segments: list[SegmentStat]
    model: str = ""


class RaceRecord(BaseModel):
    """Una carrera completada con su resultado y lo que dijo el atleta, para la base de conocimiento."""

    race_name: str
    distance: str
    days_ago: int
    total_s: int
    brief: str = ""
    summary: str = ""
    insights: list[str] = Field(default_factory=list)


class KnowledgeRequest(BaseModel):
    profile: str
    fitness: str
    weight_kg: float
    height_cm: float
    races: list[RaceRecord] = Field(default_factory=list)


class TrainingFacts(BaseModel):
    """Lo que vino entrenando, calculado en Python a partir de los datos importados."""

    weeks: int
    weekly_hours: float
    hours_by_sport: dict[str, float]
    sessions_by_sport: dict[str, int]
    ctl: float
    tsb: float
    ftp_w: int
    ftp_w_kg: float
    longest_bike_min: float
    longest_run_min: float
    readiness_today: int


class KnowledgeDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    training_summary: str
    races_summary: str
    athlete_profile: str
    strengths: list[str] = Field(min_length=1, max_length=5)
    opportunities: list[str] = Field(min_length=1, max_length=5)
    next_focus: list[str] = Field(min_length=1, max_length=4)


class KnowledgeBase(KnowledgeDraft):
    athlete_name: str
    facts: TrainingFacts
    model: str = ""


class KnowledgeContext(BaseModel):
    """Resumen corto que se inyecta en el contexto de los agentes."""

    text: str = Field(max_length=4000)
