import type { Ref } from "vue";
import M from "maplibre-gl";
import type { FilterSpecification, HeatmapLayerSpecification } from "maplibre-gl";
import { createHeatmapColorMap } from "@/colormaps/utils";

// A point-density heatmap layer. The points can come from:
//   - a GeoJSON FeatureCollection of points,
//   - an array of records with `lat`/`lon` (other fields become properties), or
//   - the id of a source already on the map (e.g. to pair with another dataset's points).
// `options.paint` is merged over the defaults below; e.g. pass "heatmap-weight"
// to weight by a property instead of plain counts.

export type HeatmapPaint = NonNullable<HeatmapLayerSpecification["paint"]>;
export type LatLonRecord = { lat: number; lon: number; [key: string]: unknown };
export type HeatmapData = string | GeoJSON.FeatureCollection | LatLonRecord[];

export interface HeatmapOptions {
  paint?: HeatmapPaint;
  filter?: FilterSpecification;
  beforeId?: string; // layer to insert beneath
  visible?: boolean; // default true
  attribution?: string;
}

const pixelRatio = window.devicePixelRatio || 1;

export const DEFAULT_HEATMAP_PAINT: HeatmapPaint = {
  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4 / pixelRatio, 9, 40 / pixelRatio],
  "heatmap-intensity": 1,
  "heatmap-weight": 1, // every point counts the same
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], ...createHeatmapColorMap("viridis", [0.1, 0.2, 0.4, 0.6, 0.8, 1], 0.05)] as any,
  "heatmap-opacity": 0.8,
};

function toFeatureCollection(data: GeoJSON.FeatureCollection | LatLonRecord[] | null): GeoJSON.FeatureCollection {
  if (data === null) { return { type: "FeatureCollection", features: [] }; }
  if (!Array.isArray(data)) { return data; }
  return {
    type: "FeatureCollection",
    features: data.map(({ lat, lon, ...properties }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties,
    })),
  };
}

export function addHeatmap(
  map: Ref<M.Map | null>,
  id: string,
  data: HeatmapData | null,
  options: HeatmapOptions = {},
) {
  // a string is someone else's source; anything else gets our own GeoJSON source
  const sourceId = typeof data === "string" ? data : `${id}-source`;
  const ownsSource = typeof data !== "string";
  let features = ownsSource ? toFeatureCollection(data as GeoJSON.FeatureCollection | LatLonRecord[] | null) : null;
  let filter = options.filter;

  function init() {
    const m = map.value;
    if (!m) { return; }
    if (ownsSource && !m.getSource(sourceId)) {
      m.addSource(sourceId, { type: "geojson", data: features!, attribution: options.attribution });
    }
    if (!m.getSource(sourceId)) {
      console.warn(`addHeatmap(${id}): source "${sourceId}" isn't on the map yet`);
      return;
    }
    if (!m.getLayer(id)) {
      m.addLayer({
        id,
        type: "heatmap",
        source: sourceId,
        paint: { ...DEFAULT_HEATMAP_PAINT, ...options.paint },
        layout: { visibility: options.visible === false ? "none" : "visible" },
        ...(filter ? { filter } : {}),
      }, options.beforeId && m.getLayer(options.beforeId) ? options.beforeId : undefined);
    }
  }

  /** Replace the points (only for heatmaps that own their source). */
  function setData(newData: GeoJSON.FeatureCollection | LatLonRecord[]) {
    if (!ownsSource) {
      console.warn(`addHeatmap(${id}): data comes from source "${sourceId}", update it there`);
      return;
    }
    features = toFeatureCollection(newData);
    (map.value?.getSource(sourceId) as M.GeoJSONSource | undefined)?.setData(features);
  }

  function setFilter(newFilter: FilterSpecification | null) {
    filter = newFilter ?? undefined;
    if (map.value?.getLayer(id)) { map.value.setFilter(id, newFilter); }
  }

  function remove() {
    const m = map.value;
    if (!m) { return; }
    if (m.getLayer(id)) { m.removeLayer(id); }
    if (ownsSource && m.getSource(sourceId)) { m.removeSource(sourceId); }
  }

  return { id, sourceId, init, setData, setFilter, remove };
}
