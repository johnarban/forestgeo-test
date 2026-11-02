import { ref, type Ref } from "vue";
import M from "maplibre-gl";
import { addHeatmap } from "./addHeatmap";
import { DENDROBAND_LAYER_ID, genusColorExpression, spInfo } from "./addDendrobands";
import { PLOT_HEATMAP_RADIUS } from "./addTreeDensity";

// SERC ForestGEO census tree list (public/serc_trees.geojson): one point per
// tree with DBH/status/date for four censuses (_1 .. _4, 2009-2024).
// A density heatmap (on) and a point layer (off) share one source.
export const SERC_TREES_ID = "serc-census-trees";
export const SERC_TREES_DENSITY_ID = "serc-census-trees-density";
const SOURCE_ID = "serc-census-trees-source";
const ATTRIBUTION = 'Tree census: <a href="https://forestgeo.si.edu" target="_blank" rel="noopener noreferrer">SERC ForestGEO</a>';

export function addSercTrees(map: Ref<M.Map | null>) {
  const loading = ref(false);

  const heatmap = addHeatmap(map, SERC_TREES_DENSITY_ID, SOURCE_ID, {
    beforeId: SERC_TREES_ID,
    paint: { "heatmap-radius": PLOT_HEATMAP_RADIUS },
  });

  function setupPopup(m: M.Map) {
    const popup = new M.Popup({ closeButton: true, closeOnClick: true, className: "tree-popup" });
    m.on("mouseenter", SERC_TREES_ID, () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", SERC_TREES_ID, () => { m.getCanvas().style.cursor = ""; });
    m.on("click", SERC_TREES_ID, (e) => {
      const feature = e.features?.[0];
      if (!feature) { return; }
      const p = feature.properties ?? {};
      const info = spInfo(p.sp);
      const censuses = [1, 2, 3, 4]
        .filter((i) => p[`ExactDate_${i}`])
        .map((i) => `<tr><td class="k">${p[`ExactDate_${i}`]}</td><td class="v">${p[`dbh_${i}`] ?? "–"} cm, ${p[`status_${i}`] ?? "–"}</td></tr>`)
        .join("");
      popup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .setLngLat((feature.geometry as any).coordinates.slice())
        .setHTML(`
          <div class="tree-popup-body">
            <div class="tree-popup-title">${info?.common ?? p.sp ?? "Unknown species"}</div>
            ${info ? `<div class="tree-popup-latin">${info.latin}</div>` : ""}
            <table>
              <tr><td class="k">Tag</td><td class="v">${p.tag}</td></tr>
              <tr><td class="k">Quadrat</td><td class="v">${p.quadrat}</td></tr>
              ${censuses}
            </table>
          </div>`)
        .addTo(m);
    });
  }

  async function init() {
    const m = map.value;
    if (!m) { return; }
    loading.value = true;
    try {
      const resp = await fetch("serc_trees.geojson");
      if (!resp.ok) { throw new Error(`HTTP ${resp.status}`); }
      const data = (await resp.json()) as GeoJSON.FeatureCollection;

      if (!m.getSource(SOURCE_ID)) {
        m.addSource(SOURCE_ID, { type: "geojson", data, attribution: ATTRIBUTION });
      }
      if (!m.getLayer(SERC_TREES_ID)) {
        m.addLayer({
          id: SERC_TREES_ID,
          type: "circle",
          source: SOURCE_ID,
          layout: { visibility: "none" }, // off by default; turn on from the layer panel
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 1.5, 18, 5],
            "circle-color": genusColorExpression(),
            "circle-opacity": 0.85,
            "circle-stroke-width": 0.5,
            "circle-stroke-color": "#333",
          },
        }, m.getLayer(DENDROBAND_LAYER_ID) ? DENDROBAND_LAYER_ID : undefined);
        setupPopup(m);
      }
      heatmap.init(); // beneath the points
    } catch (error) {
      console.error("Failed to load SERC census trees:", error);
    } finally {
      loading.value = false;
    }
  }

  return { loading, init };
}
