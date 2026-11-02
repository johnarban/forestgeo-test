import { ref, type Ref } from "vue";
import M from "maplibre-gl";
import { DENDROBAND_LAYER_ID } from "./addDendrobands";

// Natural Earth 10m physical water: lake/river-lake polygons and river
// centerlines. Downloaded into public/ from the natural-earth-vector GeoJSON
// mirror (https://github.com/nvkelso/natural-earth-vector). This is coarse,
// continental-scale data -- it gives context when zoomed out to a species range,
// not detail at the SCBI plot.
const WATER_COLOR = "#5a9fd4";
const ATTRIBUTION = 'Water: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>';

const LAKES_ID = "ne-lakes";
const RIVERS_ID = "ne-rivers";

/**
 * Adds the Natural Earth lakes (fill) and rivers (line) beneath the dendroband
 * points. Follows the `add<Dataset>(map)` shape used by the other modules here.
 */
export function addWater(map: Ref<M.Map | null>) {
  const loading = ref(false);

  async function init() {
    const m = map.value;
    if (!m) { return; }
    loading.value = true;
    try {
      const [lakes, rivers] = await Promise.all([
        fetch("ne_10m_lakes.geojson").then((r) => {
          if (!r.ok) { throw new Error(`lakes: HTTP ${r.status}`); }
          return r.json();
        }),
        fetch("ne_10m_rivers_lake_centerlines.geojson").then((r) => {
          if (!r.ok) { throw new Error(`rivers: HTTP ${r.status}`); }
          return r.json();
        }),
      ]);

      // Keep water beneath the points (and beneath range overlays, which also
      // insert before the points layer).
      const before = m.getLayer(DENDROBAND_LAYER_ID) ? DENDROBAND_LAYER_ID : undefined;

      if (!m.getSource(LAKES_ID)) {
        m.addSource(LAKES_ID, { type: "geojson", data: lakes, attribution: ATTRIBUTION });
      }
      if (!m.getLayer(LAKES_ID)) {
        m.addLayer({
          id: LAKES_ID,
          type: "fill",
          source: LAKES_ID,
          paint: { "fill-color": WATER_COLOR, "fill-opacity": 0.55 },
        }, before);
      }

      if (!m.getSource(RIVERS_ID)) {
        m.addSource(RIVERS_ID, { type: "geojson", data: rivers, attribution: ATTRIBUTION });
      }
      if (!m.getLayer(RIVERS_ID)) {
        m.addLayer({
          id: RIVERS_ID,
          type: "line",
          source: RIVERS_ID,
          paint: {
            "line-color": WATER_COLOR,
            "line-opacity": 0.8,
            "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.4, 10, 1.5],
          },
        }, before);
      }
    } catch (error) {
      console.error("Failed to load Natural Earth water layers:", error);
    } finally {
      loading.value = false;
    }
  }

  return { loading, init };
}
