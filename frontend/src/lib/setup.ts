"use client";

// Configuración del atleta (onboarding, agenda de carreras, dispositivos). Persistida en el navegador.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EnduranceProfile = "running" | "cycling" | "duathlon" | "triathlon";
export type FitnessState = "low_training" | "other_coach" | "gym_only" | "inactive";
export type Provider = "garmin" | "strava" | "wahoo";

export const PROFILE_META: Record<EnduranceProfile, { label: string; detail: string }> = {
  running: { label: "Running", detail: "Calle, trail y pista" },
  cycling: { label: "Ciclismo", detail: "Ruta, gran fondo y contrarreloj" },
  duathlon: { label: "Duatlón", detail: "Correr, pedalear, correr" },
  triathlon: { label: "Triatlón", detail: "Nadar, pedalear, correr" },
};

export const FITNESS_META: Record<FitnessState, { label: string; detail: string; volume: number }> = {
  low_training: { label: "Entrenando poco", detail: "Algunas sesiones por semana, sin estructura", volume: 0.7 },
  other_coach: { label: "Vengo de otro coach", detail: "Ya tengo base y entreno con un plan", volume: 1 },
  gym_only: { label: "Solo gym", detail: "Fuerza y máquinas, poco trabajo aeróbico específico", volume: 0.6 },
  inactive: { label: "No entrené nada últimamente", detail: "Vuelvo después de un parate", volume: 0.5 },
};

export const PROVIDER_META: Record<Provider, { label: string; imports: string }> = {
  garmin: { label: "Garmin Connect", imports: "Actividades, sueño, HRV y FC en reposo" },
  strava: { label: "Strava", imports: "Actividades y segmentos" },
  wahoo: { label: "Wahoo", imports: "Sesiones de bici con potencia" },
};

/** Condiciones alimentarias que adaptan el plan de comidas (no es indicación médica). */
export type DietCondition = "celiaquia" | "lactosa" | "diabetes" | "vegetariano";
export const CONDITION_META: Record<DietCondition, { label: string; badge: string }> = {
  celiaquia: { label: "Celiaquía", badge: "Sin TACC" },
  lactosa: { label: "Intolerancia a la lactosa", badge: "Sin lactosa" },
  diabetes: { label: "Diabetes", badge: "Carbohidratos parejos" },
  vegetariano: { label: "Vegetariano", badge: "Sin carne" },
};

export interface RaceEvent {
  id: string;
  name: string;
  sport: EnduranceProfile;
  distance: string;
  dayOffset: number;
  location: string;
}

// Calendario de demo (fechas relativas a hoy).
export const RACE_CATALOG: RaceEvent[] = [
  { id: "im703-bsas", name: "IRONMAN 70.3 Buenos Aires", sport: "triathlon", distance: "70.3", dayOffset: 7, location: "Buenos Aires" },
  { id: "tri-olimpico-nordelta", name: "Triatlón Olímpico Nordelta", sport: "triathlon", distance: "Olímpico", dayOffset: 35, location: "Tigre" },
  { id: "tri-sprint-mdp", name: "Triatlón Sprint Mar del Plata", sport: "triathlon", distance: "Sprint", dayOffset: 77, location: "Mar del Plata" },
  { id: "im-140-floripa", name: "IRONMAN Florianópolis", sport: "triathlon", distance: "140.6", dayOffset: 210, location: "Florianópolis" },
  { id: "du-sprint-costanera", name: "Duatlón Sprint Costanera", sport: "duathlon", distance: "5 / 20 / 2,5 km", dayOffset: 21, location: "Buenos Aires" },
  { id: "du-standard-pilar", name: "Duatlón Standard Pilar", sport: "duathlon", distance: "10 / 40 / 5 km", dayOffset: 63, location: "Pilar" },
  { id: "run-10k-nocturna", name: "10K Nocturna", sport: "running", distance: "10 km", dayOffset: 14, location: "Buenos Aires" },
  { id: "run-21k-rosario", name: "Media Maratón de Rosario", sport: "running", distance: "21,1 km", dayOffset: 28, location: "Rosario" },
  { id: "run-42k-bsas", name: "Maratón de Buenos Aires", sport: "running", distance: "42,2 km", dayOffset: 49, location: "Buenos Aires" },
  { id: "bike-gf-tandil", name: "Gran Fondo Tandil", sport: "cycling", distance: "160 km", dayOffset: 42, location: "Tandil" },
  { id: "bike-crono-lp", name: "Contrarreloj La Plata", sport: "cycling", distance: "40 km", dayOffset: 24, location: "La Plata" },
  { id: "bike-gf-mendoza", name: "Gran Fondo Mendoza", sport: "cycling", distance: "120 km", dayOffset: 90, location: "Mendoza" },
];

export const raceById = (id: string) => RACE_CATALOG.find((r) => r.id === id);

/** Franja horaria en la que el atleta puede entrenar. */
export interface TrainingSlot {
  id: string;
  time: string; // "HH:MM"
  minutes: number;
}

interface SetupState {
  completed: boolean;
  slots: TrainingSlot[];
  profile: EnduranceProfile;
  fitness: FitnessState;
  weightKg: number;
  heightCm: number;
  agenda: string[];
  devices: Record<Provider, boolean>;
  lastSync: number | null;
  showNutrition: boolean;
  conditions: DietCondition[];

  update(patch: Partial<Pick<SetupState, "profile" | "fitness" | "weightKg" | "heightCm" | "showNutrition">>): void;
  toggleCondition(c: DietCondition): void;
  complete(): void;
  restart(): void;
  toggleRace(id: string): void;
  setDevice(p: Provider, connected: boolean): void;
  sync(): void;
  addSlot(): void;
  updateSlot(id: string, patch: Partial<Omit<TrainingSlot, "id">>): void;
  removeSlot(id: string): void;
}

const DEFAULTS = {
  completed: false,
  profile: "triathlon" as EnduranceProfile,
  fitness: "other_coach" as FitnessState,
  weightKg: 72,
  heightCm: 178,
  agenda: ["im703-bsas"],
  devices: { garmin: true, strava: true, wahoo: false },
  lastSync: null as number | null,
  showNutrition: false,
  conditions: [] as DietCondition[],
  slots: [
    { id: "am", time: "06:30", minutes: 60 },
    { id: "pm", time: "18:00", minutes: 90 },
  ] as TrainingSlot[],
};

export const sortSlots = (slots: TrainingSlot[]) => [...slots].sort((a, b) => a.time.localeCompare(b.time));

export const useSetup = create<SetupState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set(patch),
      complete: () => set({ completed: true, lastSync: Date.now() }),
      restart: () => set({ completed: false }),
      toggleRace: (id) =>
        set((s) => ({ agenda: s.agenda.includes(id) ? s.agenda.filter((r) => r !== id) : [...s.agenda, id] })),
      setDevice: (p, connected) =>
        set((s) => ({ devices: { ...s.devices, [p]: connected }, lastSync: connected ? Date.now() : s.lastSync })),
      sync: () => set({ lastSync: Date.now() }),
      toggleCondition: (c) =>
        set((s) => ({ conditions: s.conditions.includes(c) ? s.conditions.filter((x) => x !== c) : [...s.conditions, c] })),
      addSlot: () =>
        set((s) => ({ slots: [...s.slots, { id: `s${Date.now().toString(36)}`, time: "12:30", minutes: 45 }] })),
      updateSlot: (id, patch) => set((s) => ({ slots: s.slots.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSlot: (id) => set((s) => ({ slots: s.slots.filter((x) => x.id !== id) })),
    }),
    { name: "trimind-setup", skipHydration: true },
  ),
);

export const connectedProviders = (devices: Record<Provider, boolean>) =>
  (Object.keys(devices) as Provider[]).filter((p) => devices[p]);
