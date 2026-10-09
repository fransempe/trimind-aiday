"use client";

import { Clapperboard, Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { type ExerciseMedia, exerciseMedia } from "@/lib/exercise-media";
import type { Exercise } from "@/lib/gym";

function Media({ media }: { media: ExerciseMedia }) {
  if (media.kind === "video")
    return <video src={media.src} poster={media.poster} autoPlay loop muted playsInline className="size-full object-contain" />;
  // gif e image se muestran igual; lottie queda para cuando se sume su player.
  if (media.kind === "lottie") return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.src} alt="" className="size-full object-contain" />;
}

/** Contenido del modal: pide la demo al proveedor configurado cuando se abre. */
function DemoBody({ exercise }: { exercise: Exercise }) {
  const [state, setState] = useState<{ id: string; media: ExerciseMedia | null } | null>(null);
  const loading = state?.id !== exercise.id;

  useEffect(() => {
    let alive = true;
    exerciseMedia
      .resolve(exercise)
      .catch(() => null)
      .then((media) => alive && setState({ id: exercise.id, media }));
    return () => {
      alive = false;
    };
  }, [exercise]);

  const media = loading ? null : state?.media;
  return (
    <>
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-[3px] border border-dashed border-rule-strong bg-black/20">
        {loading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando demo" />
        ) : media ? (
          <Media media={media} />
        ) : (
          <div className="px-6 text-center">
            <Clapperboard className="mx-auto size-7 text-faint" strokeWidth={1.5} />
            <p className="mt-2 text-[14px] font-medium text-muted-foreground">Demo animada próximamente</p>
            <p className="mt-1 text-[12px] text-faint">Acá se va a ver cómo se hace el ejercicio.</p>
          </div>
        )}
      </div>
      {media?.credit && <p className="mt-1.5 text-[11px] text-faint">{media.credit}</p>}
    </>
  );
}

/** Modal "Ver ejercicio": dosis, indicación técnica y la demo (cuando haya un repo conectado). */
export function ExerciseDemo({ exercise, onOpenChange }: { exercise: Exercise | null; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={!!exercise} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[4px] border border-rule-strong bg-background p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-6">
          {exercise && (
            <>
              <div className="mb-4 pr-10">
                <DialogPrimitive.Title className="text-[20px] font-semibold leading-tight">{exercise.name}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="num mt-1 text-[14px] text-muted-foreground">
                  {exercise.dose}
                  {exercise.rest && ` · descanso ${exercise.rest}`}
                </DialogPrimitive.Description>
              </div>
              <DemoBody exercise={exercise} />
              {exercise.cue && (
                <p className="mt-4 border-t border-rule pt-3 text-[14px]">
                  <span className="font-semibold">Clave técnica: </span>
                  {exercise.cue}
                </p>
              )}
            </>
          )}
          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md p-1.5 text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <X className="size-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
