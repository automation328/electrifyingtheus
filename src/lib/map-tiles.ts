// Raster tiles shared by the Leaflet maps (ChargerMap, RangeCircleMap).
//
// Tiles come from the OpenStreetMap standard layer, which needs no API key.
// Attribution is required by the ODbL and by the OSM tile usage policy and is
// set below — don't remove it. A keyed provider (MapTiler, Stadia, CARTO — all
// three now stamp "API KEY REQUIRED" across an unkeyed map) drops in by changing
// TILES and ATTRIBUTION together.
export const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
