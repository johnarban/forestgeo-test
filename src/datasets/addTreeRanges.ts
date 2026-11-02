import { ref, type Ref } from "vue";
import M from "maplibre-gl";
import { GENUS_COLORS, GENUS_FALLBACK, SP_INFO, DENDROBAND_LAYER_ID } from "./addDendrobands";

// Native tree-species range maps digitized from Little's "Atlas of United States
// Trees", via the USTreeAtlas project (https://github.com/wpetry/USTreeAtlas).
// Each file is a polygon FeatureCollection where CODE == 1 marks presence.
//
// Locally the files are served from a symlink (public/tree_ranges ->
// USTreeAtlas/geojson). That symlink is gitignored because it points at a
// machine-specific absolute path; for production, point RANGE_BASE_URL at the
// raw GitHub URLs (they send permissive CORS headers) or copy the files in.
const RANGE_BASE_URL = "tree_ranges/";
// const RANGE_BASE_URL = "https://raw.githubusercontent.com/wpetry/USTreeAtlas/main/geojson/";

// Our `sp` code -> USTreeAtlas 8-character file code. `caovl` (Carya ovalis) is
// intentionally absent: it has no map in Little's atlas.
export const SP_RANGE_CODE: Record<string, string> = {
  acru: "acerrubr",
  caca: "carpcaro",
  caco: "carycord",
  cagl: "caryglab",
  cato: "carytome",
  ceca: "cerccana",
  cofl: "cornflor",
  fagr: "fagugran",
  fram: "fraxamer",
  frni: "fraxnigr",
  juni: "juglnigr",
  litu: "lirituli",
  nysy: "nysssylv",
  pist: "pinustrb",
  ploc: "platocci",
  prse: "prunsero",
  qual: "queralba",
  qupr: "querprin",
  quru: "querrubr",
  quve: "quervelu",
  rops: "robipseu",
  saal: "sassalbi",
  tiam: "tiliamer",
  ulru: "ulmurubr",
};

export function speciesHasRange(sp: string): boolean {
  return sp in SP_RANGE_CODE;
}

function genusColor(sp: string): string {
  const genus = SP_INFO[sp]?.genus;
  return (genus && GENUS_COLORS[genus]) || GENUS_FALLBACK;
}

function layerIds(sp: string) {
  return { source: `range-src-${sp}`, fill: `range-fill-${sp}`, line: `range-line-${sp}` };
}

/**
 * Manages the per-species range polygon layers. Ranges are fetched on demand the
 * first time they are shown, colored by genus (matching the point colors), and
 * drawn beneath the dendroband points. Follows the `add<Dataset>(map)` shape used
 * by the other modules in this folder.
 */
export function addTreeRanges(map: Ref<M.Map | null>) {
  // `sp` codes currently being fetched (for a loading indicator).
  const loading = ref<string[]>([]);
  const loaded = new Set<string>();
  const inFlight = new Map<string, Promise<void>>();

  function setLoading(sp: string, on: boolean) {
    const set = new Set(loading.value);
    if (on) { set.add(sp); } else { set.delete(sp); }
    loading.value = [...set];
  }

  function ensureLoaded(sp: string): Promise<void> {
    const m = map.value;
    if (!m || loaded.has(sp)) { return Promise.resolve(); }
    const existing = inFlight.get(sp);
    if (existing) { return existing; }
    const code = SP_RANGE_CODE[sp];
    if (!code) { return Promise.resolve(); }

    const promise = (async () => {
      setLoading(sp, true);
      try {
        const resp = await fetch(`${RANGE_BASE_URL}${code}.geojson`);
        if (!resp.ok) { throw new Error(`HTTP ${resp.status} ${resp.statusText}`); }
        const data = (await resp.json()) as GeoJSON.FeatureCollection;
        const { source, fill, line } = layerIds(sp);
        const color = genusColor(sp);
        // Draw ranges beneath the points so the dendrobands stay on top.
        const before = m.getLayer(DENDROBAND_LAYER_ID) ? DENDROBAND_LAYER_ID : undefined;
        // CODE == 1 is presence; a few CODE == 0 polygons mark absence/lakes.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const presence: any = ["==", ["get", "CODE"], 1];
        if (!m.getSource(source)) {
          m.addSource(source, {
            type: "geojson",
            data,
            attribution: 'Range maps: Little\'s Atlas via <a href="https://github.com/wpetry/USTreeAtlas" target="_blank" rel="noopener noreferrer">USTreeAtlas</a>',
          });
        }
        if (!m.getLayer(fill)) {
          m.addLayer({
            id: fill,
            type: "fill",
            source,
            filter: presence,
            paint: { "fill-color": color, "fill-opacity": 0.18 },
          }, before);
        }
        if (!m.getLayer(line)) {
          m.addLayer({
            id: line,
            type: "line",
            source,
            filter: presence,
            paint: { "line-color": color, "line-width": 1, "line-opacity": 0.6 },
          }, before);
        }
        loaded.add(sp);
      } catch (error) {
        console.error(`Failed to load range for ${sp}:`, error);
      } finally {
        setLoading(sp, false);
        inFlight.delete(sp);
      }
    })();

    inFlight.set(sp, promise);
    return promise;
  }

  function setVisibility(sp: string, visible: boolean) {
    const m = map.value;
    if (!m) { return; }
    const { fill, line } = layerIds(sp);
    [fill, line].forEach((id) => {
      if (m.getLayer(id)) {
        m.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    });
  }

  /** Make exactly the given species' ranges visible, loading any as needed. */
  function setVisibleRanges(spCodes: string[]) {
    const want = new Set(spCodes.filter(speciesHasRange));
    loaded.forEach((sp) => {
      if (!want.has(sp)) { setVisibility(sp, false); }
    });
    want.forEach((sp) => {
      if (loaded.has(sp)) {
        setVisibility(sp, true);
      } else {
        ensureLoaded(sp).then(() => {
          // Only reveal if it is still wanted by the time it finishes loading.
          setVisibility(sp, want.has(sp));
        });
      }
    });
  }

  return {
    loading,
    setVisibleRanges,
  };
}
