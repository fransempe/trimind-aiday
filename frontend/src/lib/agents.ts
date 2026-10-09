import { Dumbbell, Flag, HeartPulse, type LucideIcon, ShieldCheck, TrendingUp } from "lucide-react";

export interface AgentMeta {
  id: string;
  name: string;
  role: string;
  icon: LucideIcon;
  beta?: boolean;
}

// Especialistas que consulta el router. Agregar uno acá lo suma al panel sin tocar el Head Coach.
export const SPECIALISTS: AgentMeta[] = [
  { id: "training", name: "Training Agent", role: "Carga y estímulo del plan", icon: Dumbbell },
  { id: "recovery", name: "Recovery Agent", role: "Sueño, HRV y fatiga", icon: HeartPulse },
  { id: "race", name: "Race Agent", role: "Periodización y carrera objetivo", icon: Flag },
  {
    id: "performance",
    name: "Performance Agent",
    role: "FTP y progresión",
    icon: TrendingUp,
    beta: true,
  },
];

export const HEAD_COACH: AgentMeta = {
  id: "head_coach",
  name: "Head Coach",
  role: "Arbitra y decide",
  icon: ShieldCheck,
};

export const agentById = (id: string): AgentMeta =>
  [...SPECIALISTS, HEAD_COACH].find((a) => a.id === id) ?? {
    id,
    name: id,
    role: "",
    icon: ShieldCheck,
  };

export const FACTOR_LABELS: Record<string, string> = {
  sueno: "Sueño",
  hrv: "HRV",
  fatiga_percibida: "Fatiga percibida",
  carga_reciente: "Carga reciente",
  estimulo_planificado: "Estímulo planificado",
  proximidad_carrera: "Proximidad de carrera",
  progresion_ftp: "Progresión de FTP",
  balance_forma: "Balance de forma",
};
