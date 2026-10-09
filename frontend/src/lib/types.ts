// Espejo de los modelos Pydantic de backend/app/models. Mantener sincronizado.

export type Recommendation = "train" | "modify" | "rest";
export type ImpactLevel = "low" | "moderate" | "high";
export type Sport = "swim" | "bike" | "run" | "strength";
export type Intensity =
  | "recovery"
  | "endurance"
  | "tempo"
  | "sweet_spot"
  | "threshold"
  | "vo2max"
  | "anaerobic";
export type ReadinessBand = "green" | "amber" | "red";
export type LegsFeeling = "fresh" | "normal" | "heavy" | "sore";
export type RacePhase = "build" | "taper" | "race_week";

export interface AthleteProfile {
  id: string;
  name: string;
  age: number;
  weight_kg: number;
  ftp_w: number;
  run_threshold_pace_s_per_km: number;
  swim_css_s_per_100m: number;
  lthr_bpm: number;
}

export interface Activity {
  id: string;
  day_offset: number;
  sport: Sport;
  title: string;
  duration_min: number;
  distance_km: number | null;
  tss: number;
  intensity: Intensity;
  avg_power_w: number | null;
  avg_hr_bpm: number | null;
  rpe: number | null;
}

export interface DailyWellness {
  sleep_hours: number;
  hrv_rmssd_ms: number;
  resting_hr_bpm: number;
  rpe: number | null;
  legs: LegsFeeling;
}

export interface Race {
  name: string;
  date: string;
  distance: "sprint" | "olympic" | "70.3" | "140.6";
  priority: "A" | "B" | "C";
}

export interface PowerTarget {
  low_w: number;
  high_w: number;
}

export interface WorkoutStep {
  repeat: number;
  duration_min: number;
  intensity: Intensity;
  power: PowerTarget | null;
  recovery_min: number | null;
}

export interface Workout {
  id: string;
  sport: Sport;
  title: string;
  steps: WorkoutStep[];
  planned_tss: number;
  peak_intensity: Intensity;
  total_duration_min: number;
}

export interface WorkoutCandidate {
  id: string;
  decision: Recommendation;
  description: string;
  workout: Workout | null;
}

export interface LoadMetrics {
  atl: number;
  ctl: number;
  tsb: number;
  last_48h_tss: number;
}

export interface HRVStatus {
  today_ms: number;
  baseline_30d_ms: number;
  deviation_pct: number;
}

export interface ReadinessComponents {
  hrv: number;
  sleep: number;
  load: number;
  subjective: number;
}

export interface Readiness {
  score: number;
  band: ReadinessBand;
  components: ReadinessComponents;
}

export interface AthleteSnapshot {
  profile: AthleteProfile;
  wellness_today: DailyWellness;
  load: LoadMetrics;
  hrv: HRVStatus;
  readiness: Readiness;
  race: Race;
  days_to_race: number;
  race_phase: RacePhase;
  recent_activities: Activity[];
  planned_workout: Workout;
}

export interface AgentOpinion {
  agent: string;
  recommendation: Recommendation;
  score: number;
  confidence: number;
  observations: string[];
  impact_factors: Record<string, ImpactLevel>;
  model: string;
  latency_ms: number;
}

export interface Disagreement {
  agents: string[];
  topic: string;
  resolution: string;
}

export interface CoachDecision {
  decision: Recommendation;
  original_workout: Workout;
  new_workout: Workout | null;
  confidence: number;
  primary_reason: string;
  explanation: string;
  impact_factors: Record<string, ImpactLevel>;
  opinions: AgentOpinion[];
  disagreements: Disagreement[];
  rule_retries: number;
}

export interface RuleViolation {
  rule_id: "red_readiness_high_intensity" | "vo2max_race_week" | "medical_tone";
  message: string;
}

export interface RulesResult {
  violations: RuleViolation[];
  passed: boolean;
}

// Eventos SSE del grafo (backend/app/models/events.py). "router_decided" y
// "agent_started" del Head Coach los emite el nodo correspondiente del grafo.
interface BaseEvent {
  run_id: string;
  ts: string;
}
export type GraphEvent =
  | (BaseEvent & { type: "router_decided"; agents: string[]; intent: string })
  | (BaseEvent & { type: "agent_started"; agent: string })
  | (BaseEvent & { type: "agent_completed"; opinion: AgentOpinion })
  | (BaseEvent & { type: "rules_checked"; result: RulesResult; attempt: number })
  | (BaseEvent & { type: "awaiting_approval"; decision: CoachDecision; thread_id: string })
  | (BaseEvent & {
      type: "decision_final";
      decision: CoachDecision;
      status: "auto" | "accepted" | "rejected";
    })
  | (BaseEvent & { type: "error"; node: string; message: string });

export interface AthleteStateUpdate {
  sleep_hours?: number;
  hrv_rmssd_ms?: number;
  hrv_deviation_pct?: number;
  rpe?: number;
  legs?: LegsFeeling;
  hard_run_yesterday?: boolean;
}

export interface FeedbackRequest {
  workout_id: string;
  rpe: number;
  legs: LegsFeeling;
  comment?: string;
}

export interface AskResponse {
  answer: string;
  consulted_agents: string[];
  opinions: AgentOpinion[];
}

// Serie diaria para gráficos (exportada desde Python).
export interface DailyPoint {
  day_offset: number;
  tss: number;
  atl: number;
  ctl: number;
  tsb: number;
  swim_min: number;
  bike_min: number;
  run_min: number;
  hrv_ms: number;
  hrv_baseline_ms: number | null;
  sleep_hours: number;
  resting_hr_bpm: number;
}
