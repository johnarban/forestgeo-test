<template>
  <div class="map-container">
    <v-card class="map-contents" style="width:100%; height: 100%;">
      <v-toolbar
        density="compact"
        color="var(--info-background)"
      >
        <v-toolbar-title :text="`${SITES[site].name} Dendroband Viewer`"></v-toolbar-title>
        <!-- clicking a site (even the current one) recenters the map on that plot -->
        <v-btn-toggle
          v-model="site"
          mandatory
          density="compact"
          variant="outlined"
          divided
          :color="accentColor2"
          class="site-toggle mr-3"
        >
          <v-btn
            v-for="s in siteKeys"
            :key="s"
            :value="s"
            size="small"
            @click="goToSite(s)"
          >{{ s }}</v-btn>
        </v-btn-toggle>
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

      <div class="basemap-control">
        <div class="basemap-label">Basemap</div>
        <v-btn-toggle
          v-model="basemap"
          mandatory
          density="compact"
          variant="outlined"
          divided
          color="var(--info-background)"
        >
          <v-btn value="terrain" size="small">Terrain</v-btn>
          <v-btn value="plain" size="small">Plain</v-btn>
        </v-btn-toggle>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { Map } from "maplibre-gl";
import { v4 } from "uuid";

import type { InitMapOptions, LatLngPair } from "@/types";
import { useTempoStore, type Site } from "@/stores/app";
import {
  addDendrobands,
  SP_INFO,
  GENUS_FALLBACK,
  genusEntries,
  growthGradient,
  SITES,
} from "@/datasets/addDendrobands";
import { addTreeRanges } from "@/datasets/addTreeRanges";
import { addWater } from "@/datasets/addWater";
import { addSercElevation } from "@/datasets/addSercElevation";
import { addSercSoil } from "@/datasets/addSercSoil";
import { addTreeDensity } from "@/datasets/addTreeDensity";
import { addSercTrees } from "@/datasets/addSercTrees";
import MaplibreMap from "@/components/MaplibreMap.vue";

const mapID = `map-${v4().replace("-", "")}`;
const maplibreMap = useTemplateRef<InstanceType<typeof MaplibreMap>>("maplibreMap");
const map = shallowRef<Map | null>(null);

const store = useTempoStore();
const {
  selectedYear, colorMode, availableYears, availableSpecies, selectedSpecies,
  rangeSpecies, rangeLoading, basemap, site, accentColor2,
} = storeToRefs(store);

// Optional plainer basemap (Stamen Toner Lite via Stadia -- keyless on
// localhost). It sits just above the terrain layer, so toggling its visibility
// switches the background without disturbing the data layers on top.
const retina = window.devicePixelRatio > 1 ? "@2x" : "";
const PLAIN_BASEMAP_ID = "plain-raster";

function addPlainBasemap(m: Map) {
  if (!m.getSource(PLAIN_BASEMAP_ID)) {
    m.addSource(PLAIN_BASEMAP_ID, {
      type: "raster",
      tiles: [`https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}${retina}.png`],
      tileSize: 256,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com/">Stamen Design</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
  }
  if (!m.getLayer(PLAIN_BASEMAP_ID)) {
    m.addLayer({
      id: PLAIN_BASEMAP_ID,
      type: "raster",
      source: PLAIN_BASEMAP_ID,
      minzoom: 0,
      maxzoom: 20,
      layout: { visibility: basemap.value === "plain" ? "visible" : "none" },
    });
  }
}

function applyBasemap() {
  if (map.value?.getLayer(PLAIN_BASEMAP_ID)) {
    map.value.setLayoutProperty(
      PLAIN_BASEMAP_ID,
      "visibility",
      basemap.value === "plain" ? "visible" : "none",
    );
  }
}

// One dendroband layer per site (creation, loading, filtering, coloring,
// popups live in the datasets folder alongside the other map layers).
const siteKeys = Object.keys(SITES) as Site[];
const dendrobands = siteKeys.map((s) => addDendrobands(map, s));
const loading = computed(() => dendrobands.some((d) => d.loading.value));

// Native species-range overlays (USTreeAtlas). Toggled from the left panel via
// `rangeSpecies` in the store; bridge its loading state back to the store.
const treeRanges = addTreeRanges(map);
watch(treeRanges.loading, (l) => { rangeLoading.value = l; });

// Natural Earth water/rivers context layer, shown beneath the data.
const water = addWater(map);

// SERC plot rasters (Cloud Optimized GeoTIFFs in public/), beneath the points.
const sercElevation = addSercElevation(map);
const sercSoil = addSercSoil(map);

// Tree-count heatmap per site on its dendroband source; shares the points' filter.
const treeDensity = siteKeys.map((s) => addTreeDensity(map, s));

// SERC census tree list: density heatmap (on) and points (off).
const sercTrees = addSercTrees(map);

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

// Start on the SCBI plot (Smithsonian Conservation Biology Institute, Front Royal, VA)
const homeState = ref<InitMapOptions>({
  loc: [SITES.SCBI.center[1], SITES.SCBI.center[0]] as LatLngPair,
  zoom: 16,
  t: null,
});

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

// --- Map wiring: delegate data/layer/style to the dataset composable -----
function applyFilter() {
  dendrobands.forEach((d, i) => {
    const filter = d.applyFilter(selectedYear.value, selectedSpecies.value, availableSpecies.value);
    treeDensity[i].setFilter(filter);
  });
}

async function onMapReady(m: Map) {
  map.value = m;
  store.map = m; // for the layer order panel
  // The panels finish laying out after the map is created, and MapLibre skips
  // the first size change its ResizeObserver reports, so size the canvas now.
  m.resize();
  addPlainBasemap(m); // beneath the data layers added below
  dendrobands.forEach((d) => d.init());
  treeDensity.forEach((t) => t.init()); // needs the dendroband sources from init() above
  sercElevation.init();
  sercSoil.init();
  water.init(); // async; inserts beneath the points via beforeId
  sercTrees.init(); // async, same
  dendrobands.forEach((d) => d.setColorMode(colorMode.value));
  applyFilter();

  const results = await Promise.all(dendrobands.map((d) => d.loadData()));
  const failed = siteKeys.filter((_, i) => !results[i]);
  if (failed.length) {
    store.globalWarning = `Failed to load the ${failed.join(" and ")} dendroband growth data.`;
  }
  const loaded = results.filter((r) => r !== null);
  if (!loaded.length) { return; }

  // the controls cover every site's years and species
  const years = [...new Set(loaded.flatMap((r) => r.years))].sort((a, b) => a - b);
  const species = [...new Set(loaded.flatMap((r) => r.species))].sort();
  availableYears.value = years;
  // start on a year every site has data for (SERC starts in 2010, SCBI in 2011)
  const shared = years.filter((y) => loaded.every((r) => r.years.includes(y)));
  if (years.length && !shared.includes(selectedYear.value)) {
    selectedYear.value = shared[0] ?? years[0];
  }
  availableSpecies.value = species;
  selectedSpecies.value = [...species]; // start with everything shown
  applyFilter();
}

// React to control changes
watch(selectedYear, applyFilter);
watch(selectedSpecies, (species) => {
  applyFilter();
  // Keep range overlays consistent with the species filter: drop any range for
  // a species the filter no longer includes.
  const stillShown = rangeSpecies.value.filter((sp) => species.includes(sp));
  if (stillShown.length !== rangeSpecies.value.length) {
    rangeSpecies.value = stillShown;
  }
}, { deep: true });
watch(colorMode, (mode) => dendrobands.forEach((d) => d.setColorMode(mode)));

// Show/hide native range overlays as the left-panel checkboxes change.
watch(rangeSpecies, (species) => treeRanges.setVisibleRanges(species), { deep: true });

// Switch the background between terrain and the plainer basemap.
watch(basemap, applyBasemap);

// Every site's trees are loaded; picking a site just moves the map there at
// the startup zoom.
function goToSite(s: Site) {
  map.value?.flyTo({ center: SITES[s].center, zoom: homeState.value.zoom });
}

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
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.5rem;
    padding: 0.75rem 1.5rem;
  }

  .year-control {
    flex: 1 1 100%;
    padding-bottom: 1rem;

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

  .basemap-control {
    .basemap-label {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
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
