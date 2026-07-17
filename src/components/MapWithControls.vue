<template>
  <div class="map-container">
    <v-card class="map-contents" style="width:100%; height: 100%;">
      <v-toolbar
        density="compact"
        color="var(--info-background)"
      >
        <v-toolbar-title text="SCBI Dendroband Viewer"></v-toolbar-title>
      </v-toolbar>

      <MaplibreMap
        :mapID="mapID"
        :home="homeState"
        :initial="homeState"
        width="100%"
        height="100%"
        ref="maplibreMap"
        @ready="onMapReady"
      />

      <v-progress-linear
        v-if="loading"
        indeterminate
        color="var(--info-background)"
        class="map-loading"
      />

      <!-- Legend / colorbar overlay -->
      <div class="map-legend-box">
        <template v-if="colorMode === 'genus'">
          <div class="legend-title">Genus</div>
          <div class="legend-grid">
            <div v-for="[genus, color] in genusEntries" :key="genus" class="legend-item">
              <span class="legend-swatch" :style="{ backgroundColor: color }"></span>
              <span class="legend-label">{{ genus }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch" :style="{ backgroundColor: GENUS_FALLBACK }"></span>
              <span class="legend-label">Other / unknown</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="legend-title">Growth rate (µm/day)</div>
          <div class="colorbar" :style="{ background: growthGradient }"></div>
          <div class="colorbar-ticks">
            <span>&minus;100</span>
            <span>0</span>
            <span>+100</span>
          </div>
          <div class="legend-item mt-1">
            <span class="legend-swatch" :style="{ backgroundColor: GENUS_FALLBACK }"></span>
            <span class="legend-label">No data</span>
          </div>
        </template>
      </div>
    </v-card>

    <div class="controls-row">
      <div class="year-control">
        <div class="year-label">Year: <strong>{{ selectedYear }}</strong></div>
        <v-slider
          v-model="selectedYear"
          :min="minYear"
          :max="maxYear"
          :step="1"
          color="var(--info-background)"
          :ticks="tickLabels"
          show-ticks="always"
          tick-size="4"
          hide-details
        />
      </div>

      <v-select
        v-model="selectedSpecies"
        :items="speciesItems"
        item-title="title"
        item-value="value"
        label="Species"
        multiple
        density="compact"
        variant="outlined"
        hide-details
        class="species-select"
      >
        <template #prepend-item>
          <v-list-item title="Select all" @click="toggleSelectAllSpecies">
            <template #prepend>
              <v-checkbox-btn
                :model-value="allSpeciesSelected"
                :indeterminate="someSpeciesSelected && !allSpeciesSelected"
              />
            </template>
          </v-list-item>
          <v-divider />
        </template>

        <template #item="{ props: itemProps, item }">
          <v-list-item
            v-bind="itemProps"
            :subtitle="item.raw.subtitle"
          />
        </template>

        <template #selection="{ index }">
          <span v-if="index === 0" class="text-caption">{{ speciesSelectionLabel }}</span>
        </template>
      </v-select>

      <v-select
        v-model="colorMode"
        :items="colorModeItems"
        label="Color by"
        density="compact"
        variant="outlined"
        hide-details
        class="color-mode-select"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { Map, Popup } from "maplibre-gl";
import { v4 } from "uuid";

import type { InitMapOptions, LatLngPair } from "@/types";
import { useTempoStore } from "@/stores/app";
import { useGeoJsonLayer } from "@/composables/useGeoJsonLayer";
import MaplibreMap from "@/components/MaplibreMap.vue";

const mapID = `map-${v4().replace("-", "")}`;
const maplibreMap = useTemplateRef<InstanceType<typeof MaplibreMap>>("maplibreMap");
const map = shallowRef<Map | null>(null);

const store = useTempoStore();
const { selectedYear, colorMode, availableYears, availableSpecies, selectedSpecies } = storeToRefs(store);

// The dendroband_growth dataset identifies species only by a 4-letter `sp` code,
// so everything else (Latin/genus/family) is looked up here. The code -> Latin
// mapping comes from the SCBI measurements dataset, which carries both columns;
// common names are the USDA PLANTS database (plants.usda.gov) accepted names.
interface SpeciesInfo {
  latin: string;
  genus: string;
  family: string;
  common: string;
}

const SP_INFO: Record<string, SpeciesInfo> = {
  acru: { latin: "Acer rubrum", genus: "Acer", family: "Sapindaceae", common: "Red maple" },
  caca: { latin: "Carpinus caroliniana", genus: "Carpinus", family: "Betulaceae", common: "American hornbeam" },
  caco: { latin: "Carya cordiformis", genus: "Carya", family: "Juglandaceae", common: "Bitternut hickory" },
  cagl: { latin: "Carya glabra", genus: "Carya", family: "Juglandaceae", common: "Pignut hickory" },
  caovl: { latin: "Carya ovalis", genus: "Carya", family: "Juglandaceae", common: "Red hickory" },
  cato: { latin: "Carya tomentosa", genus: "Carya", family: "Juglandaceae", common: "Mockernut hickory" },
  ceca: { latin: "Cercis canadensis", genus: "Cercis", family: "Fabaceae", common: "Eastern redbud" },
  cofl: { latin: "Cornus florida", genus: "Cornus", family: "Cornaceae", common: "Flowering dogwood" },
  fagr: { latin: "Fagus grandifolia", genus: "Fagus", family: "Fagaceae", common: "American beech" },
  fram: { latin: "Fraxinus americana", genus: "Fraxinus", family: "Oleaceae", common: "White ash" },
  frni: { latin: "Fraxinus nigra", genus: "Fraxinus", family: "Oleaceae", common: "Black ash" },
  juni: { latin: "Juglans nigra", genus: "Juglans", family: "Juglandaceae", common: "Black walnut" },
  litu: { latin: "Liriodendron tulipifera", genus: "Liriodendron", family: "Magnoliaceae", common: "Tuliptree" },
  nysy: { latin: "Nyssa sylvatica", genus: "Nyssa", family: "Nyssaceae", common: "Blackgum" },
  pist: { latin: "Pinus strobus", genus: "Pinus", family: "Pinaceae", common: "Eastern white pine" },
  ploc: { latin: "Platanus occidentalis", genus: "Platanus", family: "Platanaceae", common: "American sycamore" },
  prse: { latin: "Prunus serotina", genus: "Prunus", family: "Rosaceae", common: "Black cherry" },
  qual: { latin: "Quercus alba", genus: "Quercus", family: "Fagaceae", common: "White oak" },
  qupr: { latin: "Quercus prinus", genus: "Quercus", family: "Fagaceae", common: "Chestnut oak" },
  quru: { latin: "Quercus rubra", genus: "Quercus", family: "Fagaceae", common: "Northern red oak" },
  quve: { latin: "Quercus velutina", genus: "Quercus", family: "Fagaceae", common: "Black oak" },
  rops: { latin: "Robinia pseudoacacia", genus: "Robinia", family: "Fabaceae", common: "Black locust" },
  saal: { latin: "Sassafras albidum", genus: "Sassafras", family: "Lauraceae", common: "Sassafras" },
  tiam: { latin: "Tilia americana", genus: "Tilia", family: "Malvaceae", common: "American basswood" },
  ulru: { latin: "Ulmus rubra", genus: "Ulmus", family: "Ulmaceae", common: "Slippery elm" },
};

function spInfo(sp: unknown): SpeciesInfo | null {
  return (typeof sp === "string" ? SP_INFO[sp.trim()] : null) ?? null;
}

// v-select items: display the common name, keep the `sp` code as the value
// (the value the map filter matches on). Sorted by common name.
const speciesItems = computed(() =>
  availableSpecies.value
    .map((sp) => ({
      title: SP_INFO[sp]?.common ?? sp,
      subtitle: SP_INFO[sp]?.latin ?? "",
      value: sp,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
);

// Species-filter helpers
const allSpeciesSelected = computed(() =>
  availableSpecies.value.length > 0 && selectedSpecies.value.length === availableSpecies.value.length
);
const someSpeciesSelected = computed(() => selectedSpecies.value.length > 0);
const speciesSelectionLabel = computed(() => {
  if (allSpeciesSelected.value) { return "All species"; }
  if (selectedSpecies.value.length === 0) { return "None"; }
  return `${selectedSpecies.value.length} of ${availableSpecies.value.length} species`;
});

function toggleSelectAllSpecies() {
  selectedSpecies.value = allSpeciesSelected.value ? [] : [...availableSpecies.value];
}

// SCBI plot (Smithsonian Conservation Biology Institute, Front Royal, VA)
const homeState = ref<InitMapOptions>({
  loc: [38.8925, -78.1465] as LatLngPair,
  zoom: 16,
  t: null,
});

const loading = ref(false);

// --- Year selector -------------------------------------------------------
const minYear = 2010;
const maxYear = 2026;
const tickLabels = computed<Record<number, string>>(() => {
  const labels: Record<number, string> = {};
  for (let y = minYear; y <= maxYear; y++) {
    // label every other year to keep the axis readable
    labels[y] = (y % 2 === 0) ? `${y}` : "";
  }
  return labels;
});

// --- Color modes ---------------------------------------------------------
const colorModeItems = [
  { title: "Genus", value: "genus" },
  { title: "Growth rate (µm/day)", value: "growth" },
];

// Distinct color per genus. Fallback (unknown/null) is gray.
/* eslint-disable @typescript-eslint/naming-convention */
const GENUS_COLORS: Record<string, string> = {
  Acer: "#e6194b",
  Carpinus: "#3cb44b",
  Carya: "#ffe119",
  Cercis: "#4363d8",
  Cornus: "#f58231",
  Fagus: "#911eb4",
  Fraxinus: "#42d4f4",
  Juglans: "#f032e6",
  Liriodendron: "#bfef45",
  Nyssa: "#fabed4",
  Pinus: "#469990",
  Platanus: "#dcbeff",
  Prunus: "#9a6324",
  Quercus: "#800000",
  Robinia: "#aaffc3",
  Sassafras: "#808000",
  Tilia: "#ffd8b1",
  Ulmus: "#000075",
};
/* eslint-enable @typescript-eslint/naming-convention */
const GENUS_FALLBACK = "#9e9e9e";

// Template-facing legend data
const genusEntries = Object.entries(GENUS_COLORS);

// Diverging growth-rate color stops (µm/day -> color), shared by the map layer
// paint expression and the colorbar legend. Domain covers roughly the 5th-95th
// percentile of `rate` in the data.
const GROWTH_STOPS: [number, string][] = [
  [-100, "#5e3c99"],
  [-25, "#b2abd2"],
  [0, "#f7f7f7"],
  [50, "#a6dba0"],
  [100, "#008837"],
];
const GROWTH_MIN = GROWTH_STOPS[0][0];
const GROWTH_MAX = GROWTH_STOPS[GROWTH_STOPS.length - 1][0];
const growthGradient = `linear-gradient(to right, ${GROWTH_STOPS
  .map(([v, c]) => `${c} ${((v - GROWTH_MIN) / (GROWTH_MAX - GROWTH_MIN)) * 100}%`)
  .join(", ")})`;

// The data identifies species only by `sp`, so the per-genus colors are resolved
// through SP_INFO into a match over the species code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function genusColorExpression(): any {
  const match: (string | string[])[] = ["match", ["get", "sp"]];
  Object.entries(SP_INFO).forEach(([sp, info]) => {
    match.push(sp, GENUS_COLORS[info.genus] ?? GENUS_FALLBACK);
  });
  match.push(GENUS_FALLBACK); // default
  return match;
}

// Diverging color scale for `rate` (growth rate, µm/day).
// Shrinking (negative) -> purple/blue, ~0 -> light, growing (positive) -> green.
// `rate` is null where days == 0, which paints gray.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function growthColorExpression(): any {
  return [
    "case",
    ["==", ["get", "rate"], null], GENUS_FALLBACK,
    [
      "interpolate",
      ["linear"],
      ["get", "rate"],
      ...GROWTH_STOPS.flat(),
    ],
  ];
}

const LAYER_ID = "scbi-trees-layer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function currentColorExpression(): any {
  return colorMode.value === "growth" ? growthColorExpression() : genusColorExpression();
}

const treesLayer = useGeoJsonLayer("scbi-trees", null, {
  sourceId: "scbi-trees-source",
  layerOptions: {
    id: LAYER_ID,
    type: "circle",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        14, 2,
        18, 6,
      ],
      "circle-color": genusColorExpression(),
      "circle-opacity": 0.85,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#333",
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function speciesClause(): any {
  // All selected -> no species restriction. None selected -> show nothing.
  if (allSpeciesSelected.value || availableSpecies.value.length === 0) { return true; }
  if (selectedSpecies.value.length === 0) { return false; }
  return ["in", ["get", "sp"], ["literal", selectedSpecies.value]];
}

function applyFilter() {
  if (map.value?.getLayer(LAYER_ID)) {
    const filter = [
      "all",
      ["==", ["get", "year"], selectedYear.value],
      speciesClause(),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.value.setFilter(LAYER_ID, filter as any);
  }
}

function applyColorMode() {
  if (map.value?.getLayer(LAYER_ID)) {
    map.value.setPaintProperty(LAYER_ID, "circle-color", currentColorExpression());
  }
}

// --- Popup with tree metadata on click -----------------------------------
function setupInteractions(m: Map) {
  const popup = new Popup({ closeButton: true, closeOnClick: true, className: "tree-popup" });

  m.on("mouseenter", LAYER_ID, () => { m.getCanvas().style.cursor = "pointer"; });
  m.on("mouseleave", LAYER_ID, () => { m.getCanvas().style.cursor = ""; });

  m.on("click", LAYER_ID, (e) => {
    const feature = e.features?.[0];
    if (!feature) { return; }
    const p = feature.properties ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coords = (feature.geometry as any).coordinates.slice();

    const row = (label: string, value: unknown) =>
      (value === null || value === undefined || value === "")
        ? ""
        : `<tr><td class="k">${label}</td><td class="v">${value}</td></tr>`;

    const info = spInfo(p.sp);
    const title = info?.common ?? "Unknown species";
    const measured = (p.date_start && p.date_end) ? `${p.date_start} &rarr; ${p.date_end}` : null;
    const html = `
      <div class="tree-popup-body">
        <div class="tree-popup-title">${title}</div>
        ${info ? `<div class="tree-popup-latin">${info.latin}</div>` : ""}
        <table>
          ${row("Tag", p.tag)}
          ${row("Stem ID", p.stemID)}
          ${row("Genus", info?.genus)}
          ${row("Family", info?.family)}
          ${row("Year", p.year)}
          ${row("Quadrat", p.quadrat)}
          ${row("Measured", measured)}
          ${row("Start (mm)", p.measure_start)}
          ${row("End (mm)", p.measure_end)}
          ${row("Growth (mm)", p.growth != null ? Number(p.growth).toFixed(2) : null)}
          ${row("Days", p.days)}
          ${row("Rate (µm/day)", p.rate != null ? Number(p.rate).toFixed(1) : null)}
        </table>
      </div>`;

    popup.setLngLat(coords).setHTML(html).addTo(m);
  });
}

function onMapReady(m: Map) {
  map.value = m;
  treesLayer.addToMap(m);
  setupInteractions(m);
  applyFilter();
  applyColorMode();
  loadData();
}

async function loadData() {
  loading.value = true;
  let data: GeoJSON.FeatureCollection;
  try {
    const resp = await fetch("dendroband_growth.geojson");
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
    }
    data = (await resp.json()) as GeoJSON.FeatureCollection;
    // A couple of `sp` values carry trailing whitespace; trim so they don't read
    // as extra species in the filter or miss the color match.
    data.features.forEach((f) => {
      const sp = f.properties?.sp;
      if (typeof sp === "string" && f.properties) { f.properties.sp = sp.trim(); }
    });
    treesLayer.setData(data);
  } catch (error) {
    console.error("Failed to load dendroband growth data:", error);
    store.globalWarning = "Failed to load the dendroband growth data.";
    loading.value = false;
    return;
  }
  loading.value = false;

  // Populate available years from the data. A failure here should NOT report
  // the data as failed to load -- the points are already on the map.
  try {
    const years = new Set<number>();
    const species = new Set<string>();
    data.features.forEach((f) => {
      const y = f.properties?.year;
      if (typeof y === "number") { years.add(y); }
      const sp = f.properties?.sp;
      if (typeof sp === "string" && sp) { species.add(sp); }
    });
    availableYears.value = Array.from(years).sort((a, b) => a - b);
    if (availableYears.value.length && !availableYears.value.includes(selectedYear.value)) {
      selectedYear.value = availableYears.value[0];
    }
    availableSpecies.value = Array.from(species).sort();
    // Start with everything shown
    selectedSpecies.value = [...availableSpecies.value];
    applyFilter();
  } catch (error) {
    console.error("Error post-processing dendroband data (points still shown):", error);
  }
}

// React to control changes
watch(selectedYear, applyFilter);
watch(selectedSpecies, applyFilter, { deep: true });
watch(colorMode, applyColorMode);

void maplibreMap; // exposed ref kept for potential future use
</script>

<style lang="less">
.map-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  padding-inline: 8px;

  .map-loading {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    z-index: 1000;
  }

  .map-legend-box {
    position: absolute;
    bottom: 12px;
    left: 12px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    color: #222;
    padding: 8px 10px;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    font-size: 12px;
    max-width: 240px;

    .legend-title {
      font-weight: 700;
      margin-bottom: 6px;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-swatch {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 0.5px solid #333;
      flex-shrink: 0;
    }

    .legend-label {
      font-style: italic;
      white-space: nowrap;
    }

    .colorbar {
      width: 180px;
      height: 12px;
      border-radius: 2px;
      border: 0.5px solid #333;
    }

    .colorbar-ticks {
      display: flex;
      justify-content: space-between;
      width: 180px;
      margin-top: 2px;
    }
  }

  .controls-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 1.5rem;
  }

  .year-control {
    flex-grow: 1;

    .year-label {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
  }

  .species-select {
    max-width: 240px;
  }

  .color-mode-select {
    max-width: 220px;
  }
}

.tree-popup {
  .tree-popup-body {
    color: black;
    font-size: 13px;
    max-width: 240px;
  }
  .tree-popup-title {
    font-weight: bold;
    margin-bottom: 1px;
  }
  .tree-popup-latin {
    font-style: italic;
    color: #555;
    margin-bottom: 4px;
  }
  table {
    border-collapse: collapse;
  }
  td.k {
    font-weight: 600;
    padding-right: 8px;
    white-space: nowrap;
    vertical-align: top;
  }
  td.v {
    vertical-align: top;
  }
}
</style>
