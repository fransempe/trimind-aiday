"""Genera los JSON mock con fechas relativas (day_offset respecto de hoy = 0).

Uso: uv run python scripts/generate_mock.py
"""

import json
import random
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "mock"
FTP = 270
SEED = 703

# Factor de intensidad aproximado por zona, para calcular TSS = h * IF^2 * 100.
IF = {"recovery": 0.55, "endurance": 0.68, "tempo": 0.80, "sweet_spot": 0.88, "threshold": 0.95}

# Semana tipo. El índice es day_offset mod 7, así hoy (offset 0) cae en el día de bici
# de calidad (3x15') y ayer (offset -1) en un run suave.
WEEK = {
    0: [
        ("bike", "Bici sweet spot 2x20'", 80, "sweet_spot"),
        ("swim", "Natación técnica", 45, "endurance"),
    ],
    1: [("run", "Run tempo", 55, "tempo")],
    2: [
        ("swim", "Natación series 10x100", 50, "tempo"),
        ("bike", "Bici rodaje Z2", 60, "endurance"),
    ],
    3: [("swim", "Natación recuperación", 40, "recovery")],
    4: [("bike", "Fondo largo de bici", 180, "endurance")],
    5: [("run", "Fondo largo de run", 95, "endurance")],
    6: [("run", "Run suave", 45, "endurance")],
}
# Multiplicador de volumen por semana (6 semanas, la 4ta es de descarga).
WEEK_LOAD = [0.85, 0.92, 1.0, 0.75, 1.0, 0.95]


def tss(minutes: float, intensity: str) -> float:
    return round(minutes / 60 * IF[intensity] ** 2 * 100, 1)


def activity(rng: random.Random, offset: int, n: int, sport, title, minutes, intensity):
    a = {
        "id": f"act_{-offset:02d}_{n}",
        "day_offset": offset,
        "sport": sport,
        "title": title,
        "duration_min": minutes,
        "tss": tss(minutes, intensity),
        "intensity": intensity,
    }
    if sport == "bike":
        a["avg_power_w"] = round(FTP * IF[intensity] * rng.uniform(0.95, 1.0))
        a["distance_km"] = round(minutes / 60 * rng.uniform(30, 34), 1)
    if sport == "run":
        a["avg_hr_bpm"] = round(168 * (0.75 + IF[intensity] * 0.2) * rng.uniform(0.98, 1.02))
        a["distance_km"] = round(minutes / 60 * (60 / (5.6 - IF[intensity] * 1.3)), 1)
    if sport == "swim":
        a["distance_km"] = round(minutes / 60 * 3.2, 1)
    return a


def main() -> None:
    rng = random.Random(SEED)
    OUT.joinpath("scenarios").mkdir(parents=True, exist_ok=True)

    activities = []
    for offset in range(-42, 0):
        week = (offset + 42) // 7
        for n, (sport, title, minutes, intensity) in enumerate(WEEK[offset % 7]):
            scaled = round(minutes * WEEK_LOAD[week] * rng.uniform(0.92, 1.08))
            activities.append(activity(rng, offset, n, sport, title, scaled, intensity))

    wellness = [
        {
            "day_offset": offset,
            "sleep_hours": round(rng.uniform(7.0, 8.2), 2),
            "hrv_rmssd_ms": round(rng.gauss(62, 3), 1),
            "resting_hr_bpm": rng.randint(46, 50),
            "legs": "normal",
        }
        for offset in range(-42, 0)
    ]

    athlete = {
        "id": "ath_001",
        "name": "Tomás Ferreyra",
        "age": 36,
        "weight_kg": 72.0,
        "ftp_w": FTP,
        "run_threshold_pace_s_per_km": 270,
        "swim_css_s_per_100m": 100,
        "lthr_bpm": 168,
    }
    race = {
        "name": "IRONMAN 70.3 Buenos Aires",
        "day_offset": 7,
        "distance": "70.3",
        "priority": "A",
    }
    plan = [
        {
            "id": "wk_today",
            "day_offset": 0,
            "sport": "bike",
            "title": "3x15' a 250 W",
            "planned_tss": 88,
            "steps": [
                {
                    "duration_min": 15,
                    "intensity": "endurance",
                    "power": {"low_w": 165, "high_w": 190},
                },
                {
                    "repeat": 3,
                    "duration_min": 15,
                    "intensity": "sweet_spot",
                    "power": {"low_w": 245, "high_w": 255},
                    "recovery_min": 5,
                },
                {
                    "duration_min": 10,
                    "intensity": "recovery",
                    "power": {"low_w": 130, "high_w": 160},
                },
            ],
        }
    ]

    scenarios = {
        "normal": {
            "description": "Estado normal: buen sueño, HRV en línea, run suave ayer.",
            "wellness_today": {
                "sleep_hours": 7.67,
                "hrv_rmssd_ms": 63.0,
                "resting_hr_bpm": 47,
                "legs": "normal",
            },
        },
        "fatigued": {
            "description": "Sueño 5h12, HRV -21%, run fuerte ayer, carrera en 7 días.",
            "wellness_today": {
                "sleep_hours": 5.2,
                "hrv_rmssd_ms": 48.2,
                "resting_hr_bpm": 54,
                "rpe": 8,
                "legs": "heavy",
            },
            "yesterday_activity": {
                "id": "act_01_0",
                "day_offset": -1,
                "sport": "run",
                "title": "Run umbral 5x6'",
                "duration_min": 65,
                "tss": 92.0,
                "intensity": "threshold",
                "avg_hr_bpm": 166,
                "distance_km": 13.4,
                "rpe": 8,
            },
        },
        "recovered": {
            "description": "Durmió 8h14, HRV normal, RPE 2: se restaura el plan.",
            "wellness_today": {
                "sleep_hours": 8.23,
                "hrv_rmssd_ms": 63.5,
                "resting_hr_bpm": 46,
                "rpe": 2,
                "legs": "fresh",
            },
            "yesterday_activity": {
                "id": "act_01_0",
                "day_offset": -1,
                "sport": "run",
                "title": "Run umbral 5x6'",
                "duration_min": 65,
                "tss": 92.0,
                "intensity": "threshold",
                "avg_hr_bpm": 166,
                "distance_km": 13.4,
                "rpe": 8,
            },
        },
    }

    def dump(name: str, data) -> None:
        OUT.joinpath(name).write_text(json.dumps(data, indent=2, ensure_ascii=False), "utf-8")

    dump("athlete.json", athlete)
    dump("activities.json", activities)
    dump("wellness.json", wellness)
    dump("race.json", race)
    dump("plan.json", plan)
    for name, data in scenarios.items():
        dump(f"scenarios/{name}.json", data)
    print(f"{len(activities)} actividades, {len(wellness)} días de wellness -> {OUT}")


if __name__ == "__main__":
    main()
