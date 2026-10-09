// Arma (o actualiza) la base de conocimiento del atleta con sus carreras cargadas.
// La usan la página Base de conocimiento y el análisis de carrera, que la actualiza solo.
import { api } from "@/lib/api";
import { PAST_RACES, type RaceRecord, totalOf, trainingFacts, useRaceLog } from "@/lib/race-log";
import { FITNESS_META, PROFILE_META, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

export function raceRecords(): RaceRecord[] {
  const { results } = useRaceLog.getState();
  return PAST_RACES.filter((r) => results[r.id]).map((r) => {
    const res = results[r.id];
    return {
      race_name: r.name,
      distance: r.distance,
      days_ago: -r.dayOffset,
      total_s: totalOf(res),
      brief: res.brief,
      summary: res.debrief?.summary ?? "",
      insights: res.debrief?.insights ?? [],
    };
  });
}

export async function refreshKnowledge() {
  const setup = useSetup.getState();
  const snap = useCoach.getState().snapshot;
  const facts = trainingFacts(snap.profile, setup.weightKg, snap.load.ctl, snap.load.tsb, snap.readiness.score);
  const k = await api.buildKnowledge(
    {
      profile: PROFILE_META[setup.profile].label,
      fitness: FITNESS_META[setup.fitness].label,
      weight_kg: setup.weightKg,
      height_cm: setup.heightCm,
      races: raceRecords(),
    },
    snap.profile.name,
    facts,
  );
  useRaceLog.getState().setKnowledge(k);
  return k;
}
