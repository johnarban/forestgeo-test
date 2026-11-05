import { ref, watch, type Ref } from "vue";
import M from "maplibre-gl";
import type { FilterSpecification } from "maplibre-gl";
import type { CensusStatus, Site } from "@/stores/app";
import { addHeatmap } from "./addHeatmap";
import { DENDROBAND_LAYER_ID, genusColorExpression, spInfo } from "./addDendrobands";
import { PLOT_HEATMAP_RADIUS } from "./addTreeDensity";

// ForestGEO census tree lists: one point per stem. Per site, a density
// heatmap (on) and a point layer (off) share one source. Both follow the
// live/dead/all filter set from the layer panel (CensusStatusFilter.vue).
export const censusTreesId = (site: Site) => `${site.toLowerCase()}-census-trees`;
export const censusDensityId = (site: Site) => `${site.toLowerCase()}-census-trees-density`;
const censusSourceId = (site: Site) => `${site.toLowerCase()}-census-trees-source`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

interface CensusConfig {
  file: string;
  attribution: string;
  statusField: string; // status in the latest census; "LI" = live, anything else = dead
  // MapLibre heatmap-intensity per filter: lower it if the heatmap saturates,
  // raise it if sparse areas are too faint. Set so only the densest ~1% of the
  // plot reaches the top of the color scale at the home zoom (16).
  heatmapIntensity: Record<CensusStatus, number>;
  censusRows: (p: Props) => string; // popup <tr>s, one per census
  extraRows?: (p: Props) => string;
}

const row = (k: unknown, v: unknown) => `<tr><td class="k">${k}</td><td class="v">${v ?? "–"}</td></tr>`;
const statusText = (s: unknown) => (s === "LI" ? "Live" : s ? `Dead (${s})` : null);

/* eslint-disable @typescript-eslint/naming-convention */
const CENSUS: Record<Site, CensusConfig> = {
  // public/scbi_census.geojson: DBH (mm) for the 2008/2013/2018/2023 censuses.
  SCBI: {
    file: "scbi_census.geojson",
    attribution: 'Tree census: <a href="https://forestgeo.si.edu" target="_blank" rel="noopener noreferrer">SCBI ForestGEO</a>',
    statusField: "status",
    heatmapIntensity: { live: 0.02, dead: 0.012, all: 0.009 },
    censusRows: (p) => [2008, 2013, 2018, 2023]
      .filter((y) => p[`dbh_${y}`])
      .map((y) => row(y, `${(p[`dbh_${y}`] / 10).toFixed(1)} cm`))
      .join(""),
    extraRows: (p) => [
      row("Status", statusText(p.status)),
      p.crown_position != null ? row("Crown position", p.crown_position) : "",
      p.liana_load != null ? row("Liana load", p.liana_load) : "",
      p.dendroband ? row("Dendroband", "yes") : "",
    ].join(""),
  },
  // public/serc_trees.geojson: DBH (cm)/status/date for four censuses (_1 .. _4, 2009-2024).
  SERC: {
    file: "serc_trees.geojson",
    attribution: 'Tree census: <a href="https://forestgeo.si.edu" target="_blank" rel="noopener noreferrer">SERC ForestGEO</a>',
    statusField: "status_4",
    heatmapIntensity: { live: 0.4, dead: 0.8, all: 0.35 },
    censusRows: (p) => [1, 2, 3, 4]
      .filter((i) => p[`ExactDate_${i}`])
      .map((i) => row(p[`ExactDate_${i}`], `${p[`dbh_${i}`] ?? "–"} cm, ${p[`status_${i}`] ?? "–"}`))
      .join(""),
  },
};
/* eslint-enable @typescript-eslint/naming-convention */

function statusFilter(field: string, status: CensusStatus): FilterSpecification | null {
  if (status === "live") { return ["==", ["get", field], "LI"]; }
  if (status === "dead") { return ["!=", ["get", field], "LI"]; }
  return null;
}

export function addCensusTrees(map: Ref<M.Map | null>, site: Site, status: Readonly<Ref<CensusStatus>>) {
  const cfg = CENSUS[site];
  const layerId = censusTreesId(site);
  const densityId = censusDensityId(site);
  const sourceId = censusSourceId(site);
  const loading = ref(false);
  const filter = () => statusFilter(cfg.statusField, status.value);
  const intensity = () => cfg.heatmapIntensity[status.value];

  const heatmap = addHeatmap(map, densityId, sourceId, {
    beforeId: layerId,
    filter: filter() ?? undefined,
    paint: { "heatmap-radius": PLOT_HEATMAP_RADIUS, "heatmap-intensity": intensity() },
  });

  function applyStatus() {
    const m = map.value;
    if (!m) { return; }
    if (m.getLayer(layerId)) { m.setFilter(layerId, filter()); }
    heatmap.setFilter(filter());
    if (m.getLayer(densityId)) { m.setPaintProperty(densityId, "heatmap-intensity", intensity()); }
  }
  watch(status, applyStatus);

  function setupPopup(m: M.Map) {
    const popup = new M.Popup({ closeButton: true, closeOnClick: true, className: "tree-popup" });
    m.on("mouseenter", layerId, () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", layerId, () => { m.getCanvas().style.cursor = ""; });
    m.on("click", layerId, (e) => {
      const feature = e.features?.[0];
      if (!feature) { return; }
      const p = feature.properties ?? {};
      const info = spInfo(p.sp);
      popup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .setLngLat((feature.geometry as any).coordinates.slice())
        .setHTML(`
          <div class="tree-popup-body">
            <div class="tree-popup-title">${info?.common ?? p.sp ?? "Unknown species"}</div>
            ${info ? `<div class="tree-popup-latin">${info.latin}</div>` : ""}
            <table>
              ${row("Tag", p.tag)}
              ${row("Quadrat", p.quadrat)}
              ${cfg.censusRows(p)}
              ${cfg.extraRows?.(p) ?? ""}
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
      const resp = await fetch(cfg.file);
      if (!resp.ok) { throw new Error(`HTTP ${resp.status}`); }
      const data = (await resp.json()) as GeoJSON.FeatureCollection;

      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, { type: "geojson", data, attribution: cfg.attribution });
      }
      if (!m.getLayer(layerId)) {
        const f = filter();
        m.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          ...(f ? { filter: f } : {}),
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
      applyStatus(); // in case the filter changed while loading
    } catch (error) {
      console.error(`Failed to load ${site} census trees:`, error);
    } finally {
      loading.value = false;
    }
  }

  return { loading, init };
}
