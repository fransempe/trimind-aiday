import asyncio
from datetime import date

from app.agents import head_coach
from app.agents.registry import REGISTRY
from app.graph import runner
from app.models.decision import CoachDecision
from app.repositories.mock import load_athlete_data
from app.repositories.state import AthleteState
from app.rules import engine
from app.tools.snapshot import build_snapshot
from app.tools.workouts import build_candidates

TODAY = date(2026, 10, 7)


def _snap(scenario: str):
    return build_snapshot(load_athlete_data(scenario, today=TODAY))


def _decision(snap, candidate_id: str, **overrides) -> CoachDecision:
    cands = {c.id: c for c in build_candidates(snap.planned_workout, snap.profile.ftp_w)}
    c = cands[candidate_id]
    fields = dict(
        decision=c.decision,
        original_workout=snap.planned_workout,
        new_workout=c.workout if c.decision == "modify" else None,
        confidence=0.8,
        primary_reason="Razón",
        explanation="Explicación",
        impact_factors={},
        opinions=[],
    )
    return CoachDecision(**(fields | overrides))


async def _collect(gen):
    return [e async for e in gen]


# ---------------------------------------------------------------- reglas
def test_rule_blocks_intensity_with_red_readiness():
    snap = _snap("fatigued")
    result = engine.check(_decision(snap, "plan"), snap)
    assert [v.rule_id for v in result.violations] == ["red_readiness_high_intensity"]
    assert engine.check(_decision(snap, "z2_estimulos"), snap).passed


def test_rule_blocks_vo2max_in_race_week():
    snap = _snap("normal")
    vo2 = snap.planned_workout.model_copy(deep=True)
    vo2.steps[1].intensity = "vo2max"
    result = engine.check(_decision(snap, "plan", original_workout=vo2), snap)
    assert "vo2max_race_week" in [v.rule_id for v in result.violations]


def test_rule_blocks_medical_tone():
    snap = _snap("normal")
    bad = _decision(snap, "plan", explanation="Tu HRV indica una posible infección.")
    ok = _decision(snap, "plan", explanation="Ante cualquier duda, consultá con un profesional.")
    assert not engine.check(bad, snap).passed
    assert engine.check(ok, snap).passed


# ---------------------------------------------------------------- grafo
def test_demo_scenarios_end_to_end():
    expected = {"normal": "train", "fatigued": "modify", "recovered": "train"}
    for scenario, decision in expected.items():
        events = asyncio.run(_collect(runner.stream_recommendation(_snap(scenario))))
        types = [e["type"] for e in events]
        assert types[0] == "router_decided"
        assert types.count("agent_completed") == len(REGISTRY)
        assert events[-1]["decision"]["decision"] == decision
        assert types[-1] == ("awaiting_approval" if decision == "modify" else "decision_final")


def test_modified_plan_matches_demo_and_waits_for_athlete():
    last = asyncio.run(_collect(runner.stream_recommendation(_snap("fatigued"))))[-1]
    assert last["decision"]["new_workout"]["title"] == "60' Z2 a 175-190 W + 3x2' a 220 W"
    assert runner.is_waiting(last["thread_id"])

    final = asyncio.run(_collect(runner.stream_resume(last["thread_id"], "reject")))[-1]
    assert final["type"] == "decision_final" and final["status"] == "rejected"
    assert not runner.is_waiting(last["thread_id"])


def test_rules_send_decision_back_to_head_coach(monkeypatch):
    """Si el Head Coach elige intensidad con readiness en rojo, las reglas lo devuelven."""
    calls = []
    real_decide = head_coach.decide

    async def stubborn(snap, opinions, candidates, violations=None, force_heuristic=False):
        calls.append(bool(violations))
        if not force_heuristic:
            return _decision(snap, "plan", opinions=opinions)
        return await real_decide(snap, opinions, candidates, force_heuristic=True)

    monkeypatch.setattr(head_coach, "decide", stubborn)
    events = asyncio.run(_collect(runner.stream_recommendation(_snap("fatigued"))))
    rules = [e for e in events if e["type"] == "rules_checked"]
    assert [r["result"]["passed"] for r in rules] == [False, False, False]
    assert calls == [False, True, True, False]  # 1 decisión + 2 reintentos + respaldo seguro
    assert events[-1]["decision"]["decision"] == "modify"
    assert events[-1]["decision"]["rule_retries"] == 2


def test_ask_routes_to_relevant_agents():
    response = asyncio.run(runner.ask("¿Qué ritmo llevo en la carrera?", _snap("normal")))
    assert response.consulted_agents == ["race", "performance"]
    assert len(response.opinions) == 2 and response.answer


def test_state_update_toggles_hard_run():
    from app.models.api import AthleteStateUpdate

    st = AthleteState("normal")
    st.update(
        AthleteStateUpdate(
            hard_run_yesterday=True, sleep_hours=5.2, hrv_deviation_pct=-21, rpe=8, legs="heavy"
        )
    )
    snap = st.snapshot()
    assert snap.recent_activities[-1].intensity == "threshold"
    assert snap.readiness.band == "red"


def test_race_strategy_keeps_numbers_in_code():
    from app.agents import race_strategy
    from app.models.strategy import RaceStrategyRequest, SegmentPlan

    req = RaceStrategyRequest(
        race_name="IRONMAN 70.3",
        race_distance="70.3",
        days_to_race=7,
        segments=[
            SegmentPlan(
                sport="swim",
                label="Natación 1,9 km",
                distance_km=1.9,
                target_low=107,
                target_high=110,
                unit="s/100m",
                eta_min=35,
            ),
            SegmentPlan(
                sport="bike",
                label="Ciclismo 90 km",
                distance_km=90,
                target_low=205,
                target_high=215,
                unit="W",
                eta_min=150,
            ),
            SegmentPlan(
                sport="run",
                label="Running 21,1 km",
                distance_km=21.1,
                target_low=295,
                target_high=300,
                unit="s/km",
                eta_min=105,
            ),
        ],
    )
    st = asyncio.run(race_strategy.generate(req, load_athlete_data("normal", today=TODAY)))
    assert st.pacing in ("conservador", "equilibrado", "agresivo")
    assert len(st.segments) == 3 and all(s.notes for s in st.segments)
    f = race_strategy.PACING_FACTOR[st.pacing]
    assert st.segments[1].target_low == round(205 * f)
    assert st.estimated_finish_min > 280


def test_nutrition_agent_joins_the_daily_run():
    from app.agents.registry import REGISTRY

    assert "nutrition" in REGISTRY
    op = asyncio.run(REGISTRY["nutrition"].opine(build_snapshot(load_athlete_data("normal", today=TODAY))))
    assert op.agent == "nutrition" and "g de carbohidratos" in op.observations[0]


def test_meal_plan_numbers_in_code_and_uses_staff():
    from app.agents import meal_plan
    from app.models.nutrition import MealPlanRequest, PlannedSession, StaffNote

    snap = build_snapshot(load_athlete_data("normal", today=TODAY))
    req = MealPlanRequest(
        weight_kg=70,
        sessions=[
            PlannedSession(time="06:30", sport="strength", title="Gym", minutes=40),
            PlannedSession(time="18:00", sport="bike", title="3x15'", minutes=80, key=True, intense=True),
        ],
        decision="train",
        primary_reason="Readiness en verde.",
        staff=[StaffNote(agent="recovery", recommendation="train", observations=["Durmió 7h40."])],
    )
    plan = asyncio.run(meal_plan.generate(req, snap))
    assert [m.meal for m in plan.meals] == ["desayuno", "almuerzo", "merienda", "cena"]
    # La merienda va antes de la bici de las 18:00 y la cena es la de recuperación.
    merienda, cena = plan.meals[2], plan.meals[3]
    assert merienda.when.startswith("antes") and cena.when.startswith("después")
    assert merienda.carbs_g > 0.20 * sum(m.carbs_g for m in plan.meals)
    assert plan.carbs_g == (350, 490)  # 80' intensos sin contar el gym: 5-7 g/kg × 70 kg
    assert any("Head Coach" in c for c in plan.coordination)

    # Sin corrida previa, el nutricionista consulta a Recovery y Training.
    alone = asyncio.run(meal_plan.generate(MealPlanRequest(weight_kg=70), snap))
    assert {n.agent for n in alone.consulted} == {"recovery", "training"}
    assert alone.level == "descanso"


def test_meal_plan_adapts_to_conditions():
    from app.agents import meal_plan
    from app.models.nutrition import MealPlanRequest, PlannedSession

    snap = build_snapshot(load_athlete_data("normal", today=TODAY))
    sessions = [PlannedSession(time="18:00", sport="bike", title="3x15'", minutes=80, key=True, intense=True)]
    base = asyncio.run(meal_plan.generate(MealPlanRequest(weight_kg=70, sessions=sessions, staff=[]), snap))
    req = MealPlanRequest(weight_kg=70, sessions=sessions, conditions=["celiaquia", "lactosa", "diabetes"])
    plan = asyncio.run(meal_plan.generate(req, snap))
    foods = " ".join(f for m in plan.meals for f in m.foods)
    assert "sin TACC" in foods and "deslactosad" in foods and "miel" not in foods
    assert plan.conditions == ["celiaquia", "lactosa", "diabetes"]
    # Con diabetes el reparto es más parejo: menos diferencia entre la comida más y la menos cargada.
    def spread(p):
        return max(m.carbs_g for m in p.meals) - min(m.carbs_g for m in p.meals)

    assert spread(plan) < spread(base)


def test_ask_single_agent():
    from fastapi.testclient import TestClient

    from app.api.main import app

    client = TestClient(app)
    res = client.post("/agents/nutrition/ask", json={"question": "¿Qué como antes de la bici?"})
    assert res.status_code == 200 and res.json()["agent"] == "nutrition" and res.json()["answer"]
    res = client.post("/agents/head_coach/ask", json={"question": "¿Cómo viene mi FTP?"})
    assert res.status_code == 200 and res.json()["consulted_agents"]
    assert client.post("/agents/nadie/ask", json={"question": "hola che"}).status_code == 404


def test_race_debrief_computes_paces_in_code():
    from app.agents import knowledge
    from app.models.knowledge import RaceDebriefRequest, SegmentResult

    req = RaceDebriefRequest(
        race_name="Triatlón Olímpico Nordelta",
        distance="Olímpico",
        days_ago=120,
        source="garmin",
        segments=[
            SegmentResult(label="Natación 1,5 km", sport="swim", distance_km=1.5, time_s=1650),
            SegmentResult(label="Ciclismo 40 km", sport="bike", distance_km=40, time_s=4200),
            SegmentResult(label="Running 10 km", sport="run", distance_km=10, time_s=2700),
        ],
        transitions_s=180,
        brief="Me faltó un gel en la bici y el run se me hizo largo.",
    )
    d = asyncio.run(knowledge.debrief(req))
    assert d.total_s == 1650 + 4200 + 2700 + 180
    assert [s.pace for s in d.segments] == ["1:50 /100 m", "34.3 km/h", "4:30 /km"]
    assert d.summary and d.insights


def test_knowledge_base_feeds_agent_context():
    from app.agents import knowledge
    from app.models.knowledge import KnowledgeRequest, RaceRecord
    from app.repositories.knowledge_store import get_context, set_context

    set_context("")
    req = KnowledgeRequest(
        profile="triathlon",
        fitness="other_coach",
        weight_kg=72,
        height_cm=178,
        races=[RaceRecord(race_name="Media Maratón", distance="21 km", days_ago=40, total_s=5700)],
    )
    kb = asyncio.run(knowledge.build_knowledge(req, load_athlete_data("normal", today=TODAY)))
    assert kb.facts.weekly_hours > 0 and set(kb.facts.hours_by_sport) == {"swim", "bike", "run"}
    assert kb.strengths and kb.opportunities and "Media Maratón" in kb.races_summary
    assert get_context().startswith("Base de conocimiento de")
    set_context("")



def test_llm_cache_and_observability(tmp_path, monkeypatch):
    from pydantic import BaseModel

    from app import llm
    from app.config import settings

    class Out(BaseModel):
        answer: str

    calls = []

    async def fake_completion(**kw):
        calls.append(kw["model"])

        class Msg:
            content = '{"answer": "hola"}'

        class Choice:
            message = Msg()

        class Resp:
            choices = [Choice()]
            usage = None

        return Resp()

    monkeypatch.setattr(llm, "CACHE_PATH", tmp_path / "cache.json")
    monkeypatch.setattr(llm, "_cache", None)
    monkeypatch.setattr(llm.litellm, "acompletion", fake_completion)
    monkeypatch.setattr(settings, "llm_cache", True)
    first = asyncio.run(llm.structured(Out, "sys", "user", "m1", label="test"))
    second = asyncio.run(llm.structured(Out, "sys", "user", "m1", label="test"))
    assert calls == ["m1"] and first.value == second.value and second.model.endswith("caché")
    summary = llm.calls_summary()["summary"]
    assert summary["cached"] >= 1 and summary["llm_ok"] >= 1
