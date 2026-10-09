import { Bike, Dumbbell, Footprints, Waves } from "lucide-react";
import type { Sport } from "@/lib/types";

export const SPORT_ICON: Record<Sport, typeof Bike> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
};
