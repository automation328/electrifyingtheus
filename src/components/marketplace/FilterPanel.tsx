import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { type FilterState, activeFilterCount } from "@/lib/marketplace-filters";

const RADII = [25, 50, 100, 250];

/** A number field that commits on blur or Enter rather than on every keystroke.
 *  Price and year go upstream, and the provider is metered — a re-search per
 *  digit typed would be four searches for "2022". */
function NumberField({
  id, label, value, placeholder, onCommit,
}: {
  id: string;
  label: string;
  value?: number;
  placeholder: string;
  onCommit: (value?: number) => void;
}) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  useEffect(() => { setDraft(value == null ? "" : String(value)); }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) { onCommit(undefined); return; }
    const n = Number(trimmed.replace(/[^0-9]/g, ""));
    onCommit(Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined);
  };

  return (
    <div className="flex-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        className="mt-1 h-10 tabular-nums"
      />
    </div>
  );
}

export interface FilterPanelProps {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  radius: number | null;
  onRadiusChange: (radius: number | null) => void;
  placeLabel?: string;
}

export function FilterPanel({
  state, onChange, onClear, radius, onRadiusChange, placeLabel,
}: FilterPanelProps) {
  const active = activeFilterCount(state);

  const set = (patch: Partial<FilterState>) => onChange({ ...state, ...patch });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-charge text-base text-foreground">
          Filters{active > 0 && <span className="text-muted-foreground"> ({active})</span>}
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={active === 0}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-default disabled:text-muted-foreground/50"
        >
          Clear all
        </button>
      </div>

      {/* Condition. A segmented control rather than a dropdown: three options,
          and which one is live should be readable without opening anything. */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {(["all", "used", "new"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => set({ condition: value })}
            aria-pressed={state.condition === value}
            className={`rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              state.condition === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "all" ? "All" : value === "used" ? "Used" : "New"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Searching near</span>
          <span className="truncate text-sm font-medium text-foreground">
            {placeLabel || "—"}
          </span>
        </div>
        <div className="mt-2.5">
          <Label htmlFor="filter-radius" className="text-xs text-muted-foreground">
            Distance
          </Label>
          <Select
            value={radius == null ? "auto" : String(radius)}
            onValueChange={(value) => onRadiusChange(value === "auto" ? null : Number(value))}
          >
            <SelectTrigger id="filter-radius" className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Any distance</SelectItem>
              {RADII.map((r) => (
                <SelectItem key={r} value={String(r)}>{r} miles</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["price", "year", "mileage"]}
        className="border-t border-border"
      >
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold">Price</AccordionTrigger>
          <AccordionContent>
            <div className="flex gap-2 pb-1">
              <NumberField
                id="filter-price-min" label="Min" placeholder="$0"
                value={state.priceMin} onCommit={(v) => set({ priceMin: v })}
              />
              <NumberField
                id="filter-price-max" label="Max" placeholder="Any"
                value={state.priceMax} onCommit={(v) => set({ priceMax: v })}
              />
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              Price and year re-run the search, so they bring back different
              cars rather than hiding the ones already listed.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="year">
          <AccordionTrigger className="text-sm font-semibold">Year</AccordionTrigger>
          <AccordionContent>
            <div className="flex gap-2 pb-1">
              <NumberField
                id="filter-year-min" label="From" placeholder="2011"
                value={state.yearMin} onCommit={(v) => set({ yearMin: v })}
              />
              <NumberField
                id="filter-year-max" label="To" placeholder="Any"
                value={state.yearMax} onCommit={(v) => set({ yearMax: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="mileage">
          <AccordionTrigger className="text-sm font-semibold">Mileage</AccordionTrigger>
          <AccordionContent>
            <NumberField
              id="filter-mileage-max" label="Maximum miles" placeholder="Any"
              value={state.mileageMax} onCommit={(v) => set({ mileageMax: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="electric">
          <AccordionTrigger className="text-sm font-semibold">Electric range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <div>
                <Label htmlFor="filter-powertrain" className="text-xs text-muted-foreground">
                  Powertrain
                </Label>
                <Select
                  value={state.powertrain}
                  onValueChange={(value) =>
                    set({ powertrain: value as FilterState["powertrain"] })}
                >
                  <SelectTrigger id="filter-powertrain" className="mt-1 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Electric and plug-in hybrid</SelectItem>
                    <SelectItem value="ev">Fully electric</SelectItem>
                    <SelectItem value="phev">Plug-in hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                id="filter-range-min" label="Minimum EPA range (mi)" placeholder="Any"
                value={state.rangeMin} onCommit={(v) => set({ rangeMin: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
