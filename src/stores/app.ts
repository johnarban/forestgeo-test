import { defineStore } from "pinia";
import { ref } from "vue";

// Brutally-simplified store for the ForestGEO (SCBI dendroband) viewer.
// Most of the old TEMPO air-quality state has been removed. All that remains
// is a bit of UI theming, the panel open/close flags used by the layout, and
// the state that drives the SCBI map: the selected year and how to color points.

export type ColorMode = "genus" | "growth";
export type Basemap = "terrain" | "plain";

const createTempoStore = () => defineStore("tempods", () => {
  const debugMode = ref(false);
  const globalWarning = ref("");

  // Theming (referenced by the layout + header)
  const accentColor = ref("#068ede");
  const accentColor2 = ref("#ffcc33");
  const tempoRed = ref("#b60e32");

  // Layout panel open/close state
  const datasetControlsOpen = ref(false);
  const layerControlsOpen = ref(true);

  // SCBI dendroband viewer state
  const availableYears = ref<number[]>([]);
  const selectedYear = ref<number>(2010);
  const colorMode = ref<ColorMode>("genus");

  // Basemap: terrain (default) or a plainer light basemap that makes the
  // species-range overlays easier to see.
  const basemap = ref<Basemap>("terrain");

  // Species filter (uses the `sp` code). `selectedSpecies` is the set of species
  // currently shown; it is initialized to all species once data loads.
  const availableSpecies = ref<string[]>([]);
  const selectedSpecies = ref<string[]>([]);

  // Native species-range overlays (USTreeAtlas). `rangeSpecies` is the set of
  // `sp` codes whose range polygon is currently shown; `rangeLoading` tracks
  // which are still fetching (range files are large).
  const rangeSpecies = ref<string[]>([]);
  const rangeLoading = ref<string[]>([]);

  return {
    debugMode,
    globalWarning,

    accentColor,
    accentColor2,
    tempoRed,

    datasetControlsOpen,
    layerControlsOpen,

    availableYears,
    selectedYear,
    colorMode,
    basemap,

    availableSpecies,
    selectedSpecies,

    rangeSpecies,
    rangeLoading,
  };
});

export const useTempoStore = createTempoStore();

export type TempoStore = ReturnType<typeof useTempoStore>;

// The old TEMPO app persisted a rich store to disk/Drive. The simplified
// ForestGEO viewer has almost no persistable state, so these are minimal
// stubs kept only so the (still-registered) SaveState component resolves.
export function serializeTempoStore(_store: TempoStore): string {
  return "{}";
}

export function updateStoreFromJSON(_store: TempoStore, _json: string): boolean {
  return false;
}
