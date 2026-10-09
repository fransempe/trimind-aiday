"""Plan de comidas del día armado por el Nutrition Agent.

Interactúa con el resto del staff: toma la decisión del Head Coach y las observaciones de los
otros especialistas (de la última corrida o, si no hubo, consultando en el momento a Recovery y
Training). Python calcula los gramos de cada comida; el LLM elige alimentos y explica.
"""

import asyncio
import logging

from app.agents.base import COMMON_RULES
from app.agents.registry import REGISTRY
from app.config import settings
from app.llm import LLMError, record_heuristic, structured, to_json
from app.models.metrics import AthleteSnapshot
from app.models.nutrition import (
    Condition,
    MealDraft,
    MealPlan,
    MealPlanDraft,
    MealPlanRequest,
    MealTargets,
    PlannedMeal,
    StaffNote,
)
from app.tools.nutrition import MEALS, DayTargets, day_targets, meal_for, meal_split

log = logging.getLogger(__name__)

DEFAULT_TIME = {"desayuno": "07:30", "almuerzo": "13:00", "merienda": "17:00", "cena": "21:00"}

# Qué cambia en el plan por cada condición. Lo usan el prompt y el respaldo heurístico.
CONDITION_RULES: dict[Condition, str] = {
    "celiaquia": "Celiaquía: todo sin TACC (sin trigo, avena común, cebada ni centeno). Usá arroz, "
    "papa, batata, polenta, quinoa, legumbres y productos certificados sin TACC.",
    "lactosa": "Intolerancia a la lactosa: leche, yogur y quesos deslactosados o bebidas vegetales.",
    "diabetes": "Diabetes: carbohidratos repartidos parejo en el día, de absorción lenta (integrales, "
    "legumbres, fruta entera), siempre con proteína o grasa; azúcares rápidos solo durante el "
    "ejercicio. Los ajustes y controles van con su equipo de salud.",
    "vegetariano": "Vegetariano: sin carne ni pescado; proteína de huevos, lácteos, legumbres y tofu.",
}
# Reemplazos del respaldo heurístico por condición: (texto original, reemplazo).
SWAPS: dict[Condition, list[tuple[str, str]]] = {
    "celiaquia": [
        ("avena", "avena certificada sin TACC"),
        ("tostadas", "tostadas de pan sin TACC"),
        ("tostada", "tostada de pan sin TACC"),
        ("fideos", "fideos de arroz"),
        ("pasta", "pasta sin TACC"),
        ("granola", "granola sin TACC"),
        ("sándwich de pan", "sándwich de pan sin TACC"),
        ("1 pan", "1 pan sin TACC"),
    ],
    "lactosa": [
        ("con leche", "con leche deslactosada"),
        ("yogur", "yogur deslactosado"),
        ("queso", "queso deslactosado"),
        ("flan", "postre de bebida vegetal"),
    ],
    "diabetes": [
        ("y miel", "y canela"),
        ("con mermelada", "con queso untable"),
        ("fideos", "fideos integrales"),
        ("arroz con leche", "fruta con yogur natural"),
        ("flan", "fruta con yogur natural"),
        ("licuado de banana con leche", "yogur natural con nueces"),
    ],
    "vegetariano": [
        ("filet grande de pollo o carne magra", "porción grande de lentejas o tofu"),
        ("filet de pollo o 2 huevos", "2 huevos o 1 porción de garbanzos"),
        ("filet de pollo", "porción de lentejas"),
        ("pescado, pollo o huevos", "huevos o tofu"),
        ("pescado o pollo", "huevos o tofu"),
        ("y jamón", "y tomate"),
    ],
}


def adapt(food: str, conditions: list[Condition]) -> str:
    """Aplica a un alimento el primer reemplazo que corresponda por cada condición."""
    for c in conditions:
        for old, new in SWAPS[c]:
            if old in food and new not in food:
                food = food.replace(old, new)
                break
    return food

SYSTEM = f"""Sos el Nutrition Agent de un staff de entrenadores de triatlón. Armás el plan de
comidas del día (desayuno, almuerzo, merienda y cena) para un atleta argentino.
Recibís los gramos de carbohidratos y proteína de cada comida (ya calculados), las sesiones del
día, la decisión del Head Coach y lo que observaron los otros especialistas.
- Proponé 2 a 5 alimentos concretos por comida, con porciones caseras (taza, unidad, plato),
  usando comida habitual en Argentina. Ajustá las porciones a los gramos indicados.
- En la nota de cada comida explicá en una frase por qué así (horario, sesión, recuperación).
- En "coordination" contá cómo tuviste en cuenta al Head Coach y a los otros agentes, citándolos.
- En "tips" dejá 1 a 3 pautas de hidratación o timing.
{COMMON_RULES}
- No sos nutricionista clínico: no hagas indicaciones médicas ni de suplementos.
- Si el atleta tiene condiciones alimentarias, respetalas en TODOS los alimentos y nombralas en las notas.
- Escribí los alimentos cortos y simples: "1 taza de arroz", no recetas.
Respondé SOLO con un JSON:
{{"meals": [{{"meal": "desayuno" | "almuerzo" | "merienda" | "cena", "foods": ["..."], "note": "..."}}, ... 4 en orden],
  "coordination": ["..."],
  "tips": ["..."]}}
"""

# Respaldo determinista: alimentos por comida, en porciones chica / media / grande.
FOODS: dict[str, list[tuple[str, str, str]]] = {
    "desayuno": [
        ("1/2 taza de avena con leche", "1 taza de avena con leche", "1 taza de avena con leche y miel"),
        ("1 banana", "1 banana y 1 tostada con mermelada", "1 banana y 2 tostadas con mermelada"),
        ("1 yogur", "1 yogur con granola", "1 yogur con granola"),
    ],
    "almuerzo": [
        ("1 plato chico de arroz", "1 plato de arroz o fideos", "1 plato grande de fideos"),
        ("1 filet de pollo", "1 filet de pollo o 2 huevos", "1 filet grande de pollo o carne magra"),
        ("ensalada de hojas y tomate", "ensalada de hojas y tomate", "ensalada y 1 pan"),
    ],
    "merienda": [
        ("1 fruta", "1 fruta y 2 tostadas con queso untable", "1 sándwich de pan con queso y jamón"),
        ("1 yogur", "1 yogur", "1 licuado de banana con leche"),
    ],
    "cena": [
        ("verduras asadas", "1 plato de arroz con verduras", "1 plato grande de pasta con verduras"),
        ("1 porción de pescado o pollo", "1 porción de pescado o pollo", "1 porción de pescado, pollo o huevos"),
        ("1 fruta de postre", "1 fruta de postre", "1 flan o arroz con leche"),
    ],
}


def targets(req: MealPlanRequest, snap: AthleteSnapshot) -> tuple[DayTargets, list[MealTargets]]:
    rest = req.decision == "rest"
    sessions = [] if rest else req.sessions
    # El gym no suma a la demanda de carbohidratos: cuenta solo el trabajo de resistencia.
    minutes = sum(s.minutes for s in sessions if s.sport != "strength")
    intense = any(s.intense for s in sessions) and req.decision != "modify"
    day = day_targets(req.weight_kg, minutes, intense, snap.days_to_race)
    split = meal_split([(s.time, s.key) for s in sessions if s.sport != "strength"])
    if "diabetes" in req.conditions:  # reparto más parejo: sin picos de carbohidratos
        split = {m: (v + 0.25) / 2 for m, v in split.items()}
    carbs_mid = (day.carbs_g[0] + day.carbs_g[1]) / 2
    protein_mid = (day.protein_g[0] + day.protein_g[1]) / 2

    when = dict(DEFAULT_TIME)
    for s in sessions:
        m = meal_for(s.time)
        when[m] = f"antes de la sesión de las {s.time}"
        i = MEALS.index(m)
        if i + 1 < len(MEALS) and not when[MEALS[i + 1]].startswith("antes"):
            when[MEALS[i + 1]] = f"después de la sesión de las {s.time}"
    meals = [
        MealTargets(
            meal=m,
            when=when[m],
            carbs_g=int(round(carbs_mid * split[m] / 5) * 5),
            protein_g=int(round(protein_mid / 4 / 5) * 5),
        )
        for m in MEALS
    ]
    return day, meals


async def consult_staff(req: MealPlanRequest, snap: AthleteSnapshot) -> list[StaffNote]:
    """Si no hay una corrida reciente del staff, le pregunta a Recovery y Training."""
    if req.staff:
        return [n for n in req.staff if n.agent != "nutrition"]
    opinions = await asyncio.gather(*(REGISTRY[a].opine(snap) for a in ("recovery", "training")))
    return [StaffNote(agent=o.agent, recommendation=o.recommendation, observations=o.observations) for o in opinions]


def heuristic_draft(meals: list[MealTargets], staff: list[StaffNote], req: MealPlanRequest) -> MealPlanDraft:
    drafts = []
    for t in meals:
        base = {"desayuno": 60, "almuerzo": 80, "merienda": 50, "cena": 75}[t.meal]
        size = 0 if t.carbs_g < base * 0.8 else 2 if t.carbs_g > base * 1.3 else 1
        foods = [adapt(opts[size], req.conditions) for opts in FOODS[t.meal]]
        if t.when.startswith("antes"):
            note = f"Va {t.when}: carbohidratos fáciles de digerir, poca grasa y fibra."
        elif t.when.startswith("después"):
            note = f"Recuperación {t.when}: carbohidratos para reponer y proteína para reparar."
        else:
            note = "Comida de base del día."
        drafts.append(MealDraft(meal=t.meal, foods=foods, note=note))
    coordination = []
    if req.decision and req.primary_reason:
        coordination.append(f"Head Coach: {req.primary_reason}")
    for c in req.conditions:
        coordination.append(f"Adaptado: {CONDITION_RULES[c]}")
    for n in staff[:3]:
        coordination.append(f"{n.agent.capitalize()} Agent ({n.recommendation}): {n.observations[-1] if n.observations else 'sin observaciones'}")
    return MealPlanDraft(
        meals=drafts,
        coordination=coordination[:4] or ["Sin corrida del staff: el plan sigue la sesión planificada."],
        tips=["Tomá 500-750 ml de agua por hora de entrenamiento, más si hace calor.",
              "No pruebes comidas nuevas en la semana de carrera."],
    )


async def generate(req: MealPlanRequest, snap: AthleteSnapshot) -> MealPlan:
    day, meals = targets(req, snap)
    staff = await consult_staff(req, snap)
    draft: MealPlanDraft | None = None
    model = "heuristic"
    if settings.llm_mode == "live":
        user = (
            f"Objetivo del día: {day.label}, {day.carbs_g[0]}-{day.carbs_g[1]} g de carbohidratos, "
            f"{day.protein_g[0]}-{day.protein_g[1]} g de proteína. {day.reason}\n"
            f"Comidas (gramos ya calculados):\n{to_json([m.model_dump() for m in meals])}\n"
            f"Sesiones del día:\n{to_json([s.model_dump() for s in req.sessions])}\n"
            f"Decisión del Head Coach: {req.decision or 'sin corrida'}"
            f"{' · ' + req.primary_reason if req.primary_reason else ''}\n"
            f"Observaciones del staff:\n{to_json([n.model_dump() for n in staff])}\n"
            f"Condiciones alimentarias: "
            f"{'; '.join(CONDITION_RULES[c] for c in req.conditions) or 'ninguna'}"
        )
        try:
            result = await structured(MealPlanDraft, SYSTEM, user, settings.specialist_model, label="nutrition · plan de comidas")
            if [m.meal for m in result.value.meals] == list(MEALS):
                draft, model = result.value, result.model
        except LLMError as e:
            log.error("Plan de comidas heurístico por error del LLM: %s", e)
            record_heuristic("nutrition · plan de comidas")
    if draft is None:
        draft = heuristic_draft(meals, staff, req)
        model = "fake" if settings.llm_mode == "fake" else "heuristic-fallback"

    return MealPlan(
        level=day.level,
        label=day.label,
        reason=day.reason,
        carbs_g=day.carbs_g,
        protein_g=day.protein_g,
        meals=[PlannedMeal(**t.model_dump(), foods=d.foods, note=d.note) for t, d in zip(meals, draft.meals, strict=True)],
        coordination=draft.coordination,
        tips=draft.tips,
        consulted=staff,
        conditions=req.conditions,
        model=model,
    )
