// Rutinas de gym para deportes de resistencia: fuerza de base y una variante suave de movilidad.

export interface Exercise {
  name: string;
  dose: string;
  rest?: string;
  cue?: string;
}

export const STRENGTH_ROUTINE: Exercise[] = [
  { name: "Sentadilla goblet", dose: "3 × 10", rest: "90 s", cue: "Bajar en 3 segundos, rodillas alineadas con la punta del pie." },
  { name: "Peso muerto rumano con mancuernas", dose: "3 × 8", rest: "90 s", cue: "Espalda neutra, la cadera va hacia atrás." },
  { name: "Estocada búlgara", dose: "2 × 8 por pierna", rest: "60 s", cue: "Torso erguido, empujar con el talón de adelante." },
  { name: "Puente de glúteo a una pierna", dose: "3 × 12 por pierna", rest: "45 s" },
  { name: "Elevación de talones excéntrica", dose: "3 × 15", rest: "45 s", cue: "Subir con dos pies, bajar lento con uno: protege el tendón de Aquiles." },
  { name: "Remo con polea o banda", dose: "3 × 12", rest: "60 s" },
  { name: "Plancha frontal", dose: "3 × 40 s", rest: "30 s" },
  { name: "Pallof press", dose: "2 × 10 por lado", rest: "30 s", cue: "Resistir la rotación: estabilidad para la posición aero y la carrera." },
];

export const MOBILITY_ROUTINE: Exercise[] = [
  { name: "Movilidad de cadera 90/90", dose: "2 × 8 por lado" },
  { name: "Gato-camello", dose: "2 × 10" },
  { name: "Dead bug", dose: "3 × 8 por lado", rest: "30 s" },
  { name: "Plancha lateral", dose: "2 × 30 s por lado", rest: "30 s" },
  { name: "Estiramiento de flexores de cadera", dose: "2 × 40 s por lado" },
];
