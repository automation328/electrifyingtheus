// Curated icon set for the Icon block (kept small so the picker stays simple and
// the bundle doesn't pull in all of lucide).

import {
  Zap, Leaf, BatteryCharging, Car, Sun, Wind, DollarSign, ShieldCheck,
  Gauge, Plug, TrendingUp, Sparkles, CheckCircle2, MapPin, type LucideIcon,
} from "lucide-react";

export const BLOCK_ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  leaf: Leaf,
  battery: BatteryCharging,
  car: Car,
  sun: Sun,
  wind: Wind,
  dollar: DollarSign,
  shield: ShieldCheck,
  gauge: Gauge,
  plug: Plug,
  trending: TrendingUp,
  sparkles: Sparkles,
  check: CheckCircle2,
  pin: MapPin,
};

export const BLOCK_ICON_KEYS = Object.keys(BLOCK_ICONS);
