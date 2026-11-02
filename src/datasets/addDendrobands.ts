import { ref, type Ref } from "vue";
import { Map, Popup, type FilterSpecification } from "maplibre-gl";
import { useGeoJsonLayer } from "@/composables/useGeoJsonLayer";
import type { Site } from "@/stores/app";

// SCBI ForestGEO dendroband growth dataset (public/dendroband_growth.geojson).
// One point feature per stem per year, with the annual growth increment.
//
// The file identifies species only by a 4-letter `sp` code, so everything else
// (Latin / genus / family) is looked up here. The code -> Latin mapping comes
// from the SCBI measurements dataset, which carries both columns; common names
// are the USDA PLANTS database (plants.usda.gov) accepted names.

export type ColorMode = "genus" | "growth";

export interface SpeciesInfo {
  latin: string;
  genus: string;
  family: string;
  common: string;
}

export const SP_INFO: Record<string, SpeciesInfo> = {
  acne: { latin: "Acer negundo", genus: "Acer", family: "Sapindaceae", common: "Boxelder" },
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
  frpe: { latin: "Fraxinus pennsylvanica", genus: "Fraxinus", family: "Oleaceae", common: "Green ash" },
  juni: { latin: "Juglans nigra", genus: "Juglans", family: "Juglandaceae", common: "Black walnut" },
  list: { latin: "Liquidambar styraciflua", genus: "Liquidambar", family: "Altingiaceae", common: "Sweetgum" },
  litu: { latin: "Liriodendron tulipifera", genus: "Liriodendron", family: "Magnoliaceae", common: "Tuliptree" },
  nysy: { latin: "Nyssa sylvatica", genus: "Nyssa", family: "Nyssaceae", common: "Blackgum" },
  pist: { latin: "Pinus strobus", genus: "Pinus", family: "Pinaceae", common: "Eastern white pine" },
  pita: { latin: "Pinus taeda", genus: "Pinus", family: "Pinaceae", common: "Loblolly pine" },
  pivi: { latin: "Pinus virginiana", genus: "Pinus", family: "Pinaceae", common: "Virginia pine" },
  ploc: { latin: "Platanus occidentalis", genus: "Platanus", family: "Platanaceae", common: "American sycamore" },
  pogr: { latin: "Populus grandidentata", genus: "Populus", family: "Salicaceae", common: "Bigtooth aspen" },
  prse: { latin: "Prunus serotina", genus: "Prunus", family: "Rosaceae", common: "Black cherry" },
  qual: { latin: "Quercus alba", genus: "Quercus", family: "Fagaceae", common: "White oak" },
  quco: { latin: "Quercus coccinea", genus: "Quercus", family: "Fagaceae", common: "Scarlet oak" },
  qufa: { latin: "Quercus falcata", genus: "Quercus", family: "Fagaceae", common: "Southern red oak" },
  qumi: { latin: "Quercus michauxii", genus: "Quercus", family: "Fagaceae", common: "Swamp chestnut oak" },
  qupa: { latin: "Quercus palustris", genus: "Quercus", family: "Fagaceae", common: "Pin oak" },
  qupr: { latin: "Quercus prinus", genus: "Quercus", family: "Fagaceae", common: "Chestnut oak" },
  quru: { latin: "Quercus rubra", genus: "Quercus", family: "Fagaceae", common: "Northern red oak" },
  qust: { latin: "Quercus stellata", genus: "Quercus", family: "Fagaceae", common: "Post oak" },
  quve: { latin: "Quercus velutina", genus: "Quercus", family: "Fagaceae", common: "Black oak" },
  rops: { latin: "Robinia pseudoacacia", genus: "Robinia", family: "Fabaceae", common: "Black locust" },
  saal: { latin: "Sassafras albidum", genus: "Sassafras", family: "Lauraceae", common: "Sassafras" },
  tiam: { latin: "Tilia americana", genus: "Tilia", family: "Malvaceae", common: "American basswood" },
  ulam: { latin: "Ulmus americana", genus: "Ulmus", family: "Ulmaceae", common: "American elm" },
  ulru: { latin: "Ulmus rubra", genus: "Ulmus", family: "Ulmaceae", common: "Slippery elm" },
  vipr: { latin: "Viburnum prunifolium", genus: "Viburnum", family: "Viburnaceae", common: "Blackhaw" },
};

export function spInfo(sp: unknown): SpeciesInfo | null {
  return (typeof sp === "string" ? SP_INFO[sp.trim()] : null) ?? null;
}

// Distinct color per genus. Fallback (unknown/null) is gray.
/* eslint-disable @typescript-eslint/naming-convention */
export const GENUS_COLORS: Record<string, string> = {
  Acer: "#e6194b",
  Carpinus: "#3cb44b",
  Carya: "#ffe119",
  Cercis: "#4363d8",
  Cornus: "#f58231",
  Fagus: "#911eb4",
  Fraxinus: "#42d4f4",
  Juglans: "#f032e6",
  Liquidambar: "#fffac8",
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
export const GENUS_FALLBACK = "#9e9e9e";

// Legend data (genus swatches) for the map overlay.
export const genusEntries = Object.entries(GENUS_COLORS);

// Diverging growth-rate color stops (µm/day -> color), shared by the map layer
// paint expression and the colorbar legend. Domain covers roughly the 5th-95th
// percentile of `rate` in the data.
export const GROWTH_STOPS: [number, string][] = [
  [-100, "#5e3c99"],
  [-25, "#b2abd2"],
  [0, "#f7f7f7"],
  [50, "#a6dba0"],
  [100, "#008837"],
];
const GROWTH_MIN = GROWTH_STOPS[0][0];
const GROWTH_MAX = GROWTH_STOPS[GROWTH_STOPS.length - 1][0];
export const growthGradient = `linear-gradient(to right, ${GROWTH_STOPS
  .map(([v, c]) => `${c} ${((v - GROWTH_MIN) / (GROWTH_MAX - GROWTH_MIN)) * 100}%`)
  .join(", ")})`;

// ForestGEO plots with dendroband data. Each site gets its own source and
// layer (see addDendrobands).
export interface SiteInfo {
  name: string;
  file: string;
  center: [number, number]; // [lng, lat]
}
/* eslint-disable @typescript-eslint/naming-convention */
export const SITES: Record<Site, SiteInfo> = {
  SCBI: { name: "SCBI", file: "dendroband_growth.geojson", center: [-78.1465, 38.8925] },
  // mean lng/lat of the trees in serc_trees.geojson
  SERC: { name: "SERC", file: "serc_dendroband_growth.geojson", center: [-76.55961, 38.88915] },
};
/* eslint-enable @typescript-eslint/naming-convention */

export const dendrobandLayerId = (site: Site) => `${site.toLowerCase()}-trees-layer`;
export const dendrobandSourceId = (site: Site) => `${site.toLowerCase()}-trees-source`;
// Other overlays insert beneath SCBI's points.
export const DENDROBAND_LAYER_ID = dendrobandLayerId("SCBI");

// What loadData() extracts from the feature collection for the UI controls.
export interface DendrobandData {
  years: number[];
  species: string[];
}

// The data identifies species only by `sp`, so the per-genus colors are resolved
// through SP_INFO into a match over the species code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function genusColorExpression(): any {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function colorExpression(mode: ColorMode): any {
  return mode === "growth" ? growthColorExpression() : genusColorExpression();
}

/**
 * Creates one site's dendroband GeoJSON layer and wires up its data loading,
 * year/species filtering, coloring, and click popups. Follows the same
 * `add<Dataset>(map)` shape as the other modules in this folder.
 */
export function addDendrobands(map: Ref<Map | null>, site: Site = "SCBI") {
  const loading = ref(false);
  const layerId = dendrobandLayerId(site);

  const treesLayer = useGeoJsonLayer(`${site.toLowerCase()}-trees`, null, {
    sourceId: dendrobandSourceId(site),
    sourceSpec: {
      attribution: `Dendroband data: <a href="https://forestgeo.si.edu" target="_blank" rel="noopener noreferrer">${site} ForestGEO</a>`,
    },
    layerOptions: {
      id: layerId,
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

  // Popup with tree metadata on click.
  function setupInteractions(m: Map) {
    const popup = new Popup({ closeButton: true, closeOnClick: true, className: "tree-popup" });

    m.on("mouseenter", layerId, () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", layerId, () => { m.getCanvas().style.cursor = ""; });

    m.on("click", layerId, (e) => {
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
            ${row("Site", p.site)}
            ${row("Tag", p.tag)}
            ${row("Stem ID", p.stemID)}
            ${row("Genus", info?.genus)}
            ${row("Family", info?.family)}
            ${row("Year", p.year)}
            ${row("Quadrat", p.quadrat)}
            ${row("Measured", measured)}
            ${row("DBH (cm)", (p.dbh_start != null && p.dbh_end != null) ? `${p.dbh_start} &rarr; ${p.dbh_end}` : null)}
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

  // Add the layer to the map and wire up interactions.
  function init() {
    if (!map.value) { return; }
    treesLayer.addToMap(map.value);
    setupInteractions(map.value);
  }

  /**
   * Fetch and display this site's dendroband GeoJSON. Returns the years/species
   * present for populating the UI controls, or `null` if the data failed to load.
   */
  async function loadData(): Promise<DendrobandData | null> {
    loading.value = true;
    let data: GeoJSON.FeatureCollection;
    try {
      const resp = await fetch(SITES[site].file);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      data = (await resp.json()) as GeoJSON.FeatureCollection;
      data.features.forEach((f) => { f.properties = { ...f.properties, site }; });
      // A couple of `sp` values carry trailing whitespace; trim so they don't
      // read as extra species in the filter or miss the color match.
      data.features.forEach((f) => {
        const sp = f.properties?.sp;
        if (typeof sp === "string" && f.properties) { f.properties.sp = sp.trim(); }
      });
      treesLayer.setData(data);
    } catch (error) {
      console.error(`Failed to load ${site} dendroband growth data:`, error);
      loading.value = false;
      return null;
    }
    loading.value = false;

    const years = new Set<number>();
    const species = new Set<string>();
    data.features.forEach((f) => {
      const y = f.properties?.year;
      if (typeof y === "number") { years.add(y); }
      const sp = f.properties?.sp;
      if (typeof sp === "string" && sp) { species.add(sp); }
    });
    return {
      years: Array.from(years).sort((a, b) => a - b),
      species: Array.from(species).sort(),
    };
  }

  // Show only the selected year and species. Passing all species (or an empty
  // `availableSpecies`) applies no species restriction.
  /** Show one year and the selected species. Returns the filter so paired layers can reuse it. */
  function applyFilter(year: number, selectedSpecies: string[], availableSpecies: string[]): FilterSpecification | null {
    if (!map.value?.getLayer(layerId)) { return null; }
    const allSelected = availableSpecies.length === 0
      || selectedSpecies.length === availableSpecies.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let speciesClause: any = true;
    if (!allSelected) {
      speciesClause = selectedSpecies.length === 0
        ? false
        : ["in", ["get", "sp"], ["literal", selectedSpecies]];
    }
    const filter = ["all", ["==", ["get", "year"], year], speciesClause];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.value.setFilter(layerId, filter as any);
    return filter as FilterSpecification;
  }

  function setColorMode(mode: ColorMode) {
    if (map.value?.getLayer(layerId)) {
      map.value.setPaintProperty(layerId, "circle-color", colorExpression(mode));
    }
  }

  return {
    treesLayer,
    loading,
    init,
    loadData,
    applyFilter,
    setColorMode,
  };
}
