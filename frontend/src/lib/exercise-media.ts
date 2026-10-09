// Demos de ejercicios: punto de integración con un repo de animaciones (videos, GIFs, Lottie).
//
// Para conectar uno:
// 1. Implementar un `ExerciseMediaProvider` que, dado un ejercicio, devuelva su media (o null).
// 2. Completar `EXTERNAL_IDS` con el id de cada ejercicio en ese repo, si no se puede buscar por nombre.
// 3. Asignarlo a `exerciseMedia` abajo. El modal de "Ver ejercicio" no necesita cambios.
import type { Exercise } from "@/lib/gym";

export interface ExerciseMedia {
  kind: "video" | "gif" | "image" | "lottie";
  src: string;
  poster?: string;
  /** Atribución que pida la licencia del repo. */
  credit?: string;
}

export interface ExerciseMediaProvider {
  name: string;
  resolve(exercise: Exercise): Promise<ExerciseMedia | null>;
}

/** Id de cada ejercicio en el repo externo. Vacío hasta elegir el repo. */
export const EXTERNAL_IDS: Partial<Record<string, string>> = {};

/** Sin proveedor todavía: el modal muestra el espacio reservado para la demo. */
const noProvider: ExerciseMediaProvider = {
  name: "ninguno",
  resolve: async () => null,
};

export const exerciseMedia: ExerciseMediaProvider = noProvider;
