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
