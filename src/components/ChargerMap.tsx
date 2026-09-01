import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { kindOf, connectorLabel, portSummary, KIND_COLORS, KIND_LABELS, type Station, type StationKind } from "@/lib/stations";

// Map of AFDC charging stations, colored by what you can plug into.
//
// Lazy-loaded by FindACharger: Leaflet plus its CSS is ~45 kB gzipped and this
// is the only page that draws a map, so it must not sit in a chunk every other
// page loads.
//
// Leaflet rather than MapLibre: MapLibre renders vector tiles through a WebGL
// canvas fed by a web worker, and both v5 and v6 left every source unloaded with
// no error raised — a map that fails invisibly is worse than a plainer one that
// works. Leaflet paints raster tiles as ordinary <img> elements: no worker, no
// GPU path, nothing to fail quietly.
//
// Tiles come from the OpenStreetMap standard layer, which needs no API key.
// Attribution is required by the ODbL and by the OSM tile usage policy and is
// set below — don't remove it. A keyed provider (MapTiler, Stadia, CARTO — all
// three now stamp "API KEY REQUIRED" across an unkeyed map) drops in by changing
// TILES and ATTRIBUTION together.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

/** Station names and networks come from an external feed — never inject raw. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A teardrop pin with a bolt cut out of it. The kind reads from the color, and
 *  the bolt keeps the pin legible for anyone who cannot tell those colors apart. */
const pin = (kind: StationKind) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:26px;height:34px;filter:drop-shadow(0 1px 2px rgba(15,23,42,.35))">
      <svg viewBox="0 0 26 34" width="26" height="34" aria-hidden="true">
        <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 11.6 20 12.1 20.5a1.3 1.3 0 0 0 1.8 0C14.4 33 26 22.2 26 13 26 5.8 20.2 0 13 0z" fill="${KIND_COLORS[kind]}"/>
        <path d="M14.6 6l-6.2 9.1h4L11.4 22l6.2-9.1h-4L14.6 6z" fill="#fff"/>
      </svg></span>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });

const popupHtml = (s: Station) => {
  const kind = kindOf(s);
  const connectors = s.connectors.map(connectorLabel).join(", ");
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`;
  return `<div style="min-width:210px">
    <strong style="font-size:13px">${escapeHtml(s.name)}</strong>
    <div style="margin-top:4px;color:#475569">${escapeHtml(s.address)}, ${escapeHtml(s.city)} ${escapeHtml(s.state)}</div>
    <div style="margin-top:6px;font-weight:600;color:${KIND_COLORS[kind]}">${KIND_LABELS[kind]}</div>
    <div style="color:#475569">${escapeHtml(portSummary(s))}</div>
    ${connectors ? `<div style="margin-top:4px;color:#475569">Connectors: ${escapeHtml(connectors)}</div>` : ""}
    ${s.network ? `<div style="color:#475569">Network: ${escapeHtml(s.network)}</div>` : ""}
    ${s.pricing ? `<div style="color:#475569">Pricing: ${escapeHtml(s.pricing)}</div>` : ""}
    <a href="${directions}" target="_blank" rel="noopener noreferrer"
       style="display:inline-block;margin-top:8px;font-weight:600;color:#0057b8">Directions</a>
  </div>`;
};

interface Props {
  stations: Station[];
  center: { lat: number; lon: number };
  /** Station whose popup should open — set when a list card is clicked. */
  selectedId?: number | null;
  className?: string;
}

const ChargerMap = ({ stations, center, selectedId, className = "" }: Props) => {
  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<number, L.Marker>>(new Map());

  // Create the map once. Rebuilding it per prop change would refetch every tile,
  // which flashes the whole map on a filter click.
  useEffect(() => {
    if (!holder.current || map.current) return;
    const m = L.map(holder.current, {
      // Scroll-zoom off: the map sits mid-page, and a visitor scrolling past it
      // should scroll the page, not zoom out to the Atlantic.
      scrollWheelZoom: false,
    }).setView([center.lat, center.lon], 11);
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; layer.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw the pins whenever the results change (a new ZIP, or a filter).
  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    markers.current.clear();

    for (const s of stations) {
      const marker = L.marker([s.lat, s.lon], { icon: pin(kindOf(s)), title: s.name })
        .bindPopup(popupHtml(s));
      marker.addTo(group);
      markers.current.set(s.id, marker);
    }

    if (stations.length) {
      m.fitBounds(L.latLngBounds(stations.map((s) => [s.lat, s.lon] as [number, number])).pad(0.15), { maxZoom: 14 });
    } else {
      // No results: show the searched area rather than the last ZIP's view.
      m.setView([center.lat, center.lon], 11);
    }
  }, [stations, center.lat, center.lon]);

  // Clicking a card in the list opens that station's popup on the map.
  useEffect(() => {
    if (selectedId == null) return;
    const m = map.current;
    const marker = markers.current.get(selectedId);
    if (!m || !marker) return;
    m.setView(marker.getLatLng(), Math.max(m.getZoom(), 13));
    marker.openPopup();
  }, [selectedId]);

  return <div ref={holder} className={className} role="application" aria-label="Map of public EV charging stations" />;
};

export default ChargerMap;
