import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILES, ATTRIBUTION } from "@/lib/map-tiles";
import { METERS_PER_MILE } from "@/lib/range-map";

// Range circles around a ZIP. Lazy-loaded by the Range Map page, for the same
// chunk-size reason as ChargerMap.

export interface RangeRing {
  miles: number;
  color: string;
  label: string;
}

interface Props {
  center: { lat: number; lon: number } | null;
  /** Largest first, so the smaller rings paint on top. */
  rings: RangeRing[];
  className?: string;
}

const US_CENTER: L.LatLngTuple = [39.5, -98.35];

const RangeCircleMap = ({ center, rings, className = "" }: Props) => {
  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!holder.current || map.current) return;
    const m = L.map(holder.current, { scrollWheelZoom: false }).setView(US_CENTER, 4);
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    if (!center) return;
    const at: L.LatLngTuple = [center.lat, center.lon];
    let outer: L.Circle | null = null;
    for (const r of rings) {
      if (r.miles <= 0) continue;
      const c = L.circle(at, {
        radius: r.miles * METERS_PER_MILE,
        color: r.color, weight: 2, fillColor: r.color, fillOpacity: 0.12,
      }).bindTooltip(`${r.label}: ${r.miles} mi`, { sticky: true });
      group.addLayer(c);
      outer ??= c;
    }
    group.addLayer(L.circleMarker(at, { radius: 6, color: "#fff", weight: 2, fillColor: "#0f172a", fillOpacity: 1 }));
    if (outer) m.fitBounds(outer.getBounds(), { padding: [16, 16] });
    else m.setView(at, 9);
  }, [center, rings]);

  return <div ref={holder} className={className} role="img" aria-label="Map of driving range circles around the ZIP code" />;
};

export default RangeCircleMap;
