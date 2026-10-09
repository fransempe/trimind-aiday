"use client";

import { buildDay } from "@/lib/day";
import { importedData } from "@/lib/mock/imports";
import { buildPlan } from "@/lib/plan";
import { buildSchedule } from "@/lib/schedule";
import { connectedProviders, raceById, type RaceEvent, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

/** Día de hoy y calendario a futuro, a partir del plan, la decisión del staff y los horarios. */
export function useSchedule(days: number) {
  const setup = useSetup();
  const workout = useCoach((s) => s.activeWorkout);
  const decision = useCoach((s) => s.decision);
  const hard = useCoach((s) => s.inputs.hard_run_yesterday);

  const races = setup.agenda.map(raceById).filter((r): r is RaceEvent => !!r);
  const data = importedData(connectedProviders(setup.devices), hard);
  const plan = buildPlan({ profile: setup.profile, fitness: setup.fitness, races, importedCtl: data.ctl, sleepAvg: data.sleepAvg });
  const today = buildDay({ profile: setup.profile, fitness: setup.fitness, workout, decision, slots: setup.slots });
  const schedule = buildSchedule({ profile: setup.profile, fitness: setup.fitness, plan, races, slots: setup.slots, today, days });
  return { today, schedule, plan, slots: setup.slots };
}

export function dateFor(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}
