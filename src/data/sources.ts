// =============================================================================
// Data provenance + confidence rubric (EV Cost Calculator spec §5, §7)
//
// The spec is emphatic: every numeric output must carry a tap-to-reveal source
// chip ("Gas price: $3.62/gal — AAA, updated May 23 2026"), and the result must
// show a High/Medium/Low confidence score where "the lowest tier wins".
//
// In this static build the figures are curated rather than live, so the source
// metadata lives here. The day a data pipeline lands, these labels come from the
// data layer's source_name / fetched_at columns instead — the UX is unchanged.
// =============================================================================

export type Confidence = "high" | "medium" | "low";

/** When the curated figures were last reviewed. Stand-in for per-row fetched_at. */
export const DATA_AS_OF = "May 23, 2026";

export interface SourceMeta {
  /** Short attribution shown in the chip. */
  label: string;
  /** Where the figure comes from / how to verify. */
  href: string;
  /** Last-reviewed date for this layer. */
  asOf: string;
}

export const SOURCES = {
  gas: {
    label: "EIA / AAA state average",
    href: "https://www.eia.gov/petroleum/gasdiesel/",
    asOf: DATA_AS_OF,
  },
  electricity: {
    label: "EIA residential average",
    href: "https://www.eia.gov/electricity/data.php",
    asOf: DATA_AS_OF,
  },
  publicCharging: {
    label: "EVgo / Electrify America blended",
    href: "https://afdc.energy.gov/fuels/electricity_charging_home.html",
    asOf: DATA_AS_OF,
  },
  vehicle: {
    label: "EPA fueleconomy.gov",
    href: "https://www.fueleconomy.gov/",
    asOf: DATA_AS_OF,
  },
  incentiveFederal: {
    label: "IRS §30D · DOE AFDC",
    href: "https://afdc.energy.gov/laws/409",
    asOf: DATA_AS_OF,
  },
} satisfies Record<string, SourceMeta>;

const RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

/** Composite confidence — the lowest contributing tier wins (§5). */
export function overallConfidence(tiers: Confidence[]): Confidence {
  if (tiers.length === 0) return "medium";
  return tiers.reduce((worst, t) => (RANK[t] < RANK[worst] ? t : worst), "high" as Confidence);
}

export const CONFIDENCE_COPY: Record<Confidence, string> = {
  high: "High confidence — local utility-level data available.",
  medium: "Medium confidence — based on statewide averages. Refine with your own utility and fuel prices for a sharper estimate.",
  low: "Low confidence — national averages only. Pick your state for a better estimate.",
};
