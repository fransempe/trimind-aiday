// Rutinas de gym para deportes de resistencia: fuerza de base y una variante suave de movilidad.

export interface Exercise {
  /** Id estable: la clave para buscar la demo en un repo de animaciones (ver lib/exercise-media.ts). */
  id: string;
  name: string;
  dose: string;
  rest?: string;
  cue?: string;
}

export const STRENGTH_ROUTINE: Exercise[] = [
  { id: "sentadilla-goblet", name: "Sentadilla goblet", dose: "3 × 10", rest: "90 s", cue: "Bajar en 3 segundos, rodillas alineadas con la punta del pie." },
  { id: "peso-muerto-rumano-con-mancuernas", name: "Peso muerto rumano con mancuernas", dose: "3 × 8", rest: "90 s", cue: "Espalda neutra, la cadera va hacia atrás." },
  { id: "estocada-bulgara", name: "Estocada búlgara", dose: "2 × 8 por pierna", rest: "60 s", cue: "Torso erguido, empujar con el talón de adelante." },
  { id: "puente-de-gluteo-a-una-pierna", name: "Puente de glúteo a una pierna", dose: "3 × 12 por pierna", rest: "45 s" },
  { id: "elevacion-de-talones-excentrica", name: "Elevación de talones excéntrica", dose: "3 × 15", rest: "45 s", cue: "Subir con dos pies, bajar lento con uno: protege el tendón de Aquiles." },
  { id: "remo-con-polea-o-banda", name: "Remo con polea o banda", dose: "3 × 12", rest: "60 s" },
  { id: "plancha-frontal", name: "Plancha frontal", dose: "3 × 40 s", rest: "30 s" },
  { id: "pallof-press", name: "Pallof press", dose: "2 × 10 por lado", rest: "30 s", cue: "Resistir la rotación: estabilidad para la posición aero y la carrera." },
];

export const MOBILITY_ROUTINE: Exercise[] = [
  { id: "movilidad-de-cadera-90-90", name: "Movilidad de cadera 90/90", dose: "2 × 8 por lado" },
  { id: "gato-camello", name: "Gato-camello", dose: "2 × 10" },
  { id: "dead-bug", name: "Dead bug", dose: "3 × 8 por lado", rest: "30 s" },
  { id: "plancha-lateral", name: "Plancha lateral", dose: "2 × 30 s por lado", rest: "30 s" },
  { id: "estiramiento-de-flexores-de-cadera", name: "Estiramiento de flexores de cadera", dose: "2 × 40 s por lado" },
];
