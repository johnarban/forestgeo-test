import type { Ref } from "vue";
import type M from "maplibre-gl";
import type { Site } from "@/stores/app";
import { addHeatmap } from "./addHeatmap";
import { dendrobandLayerId, dendrobandSourceId } from "./addDendrobands";

// Density of one site's dendroband trees, one count per stem. It reads that
// site's dendroband source, which has one point per stem per year, so give it the
// same filter as the points (setFilter) or every stem is counted once per year.
export const treeDensityId = (site: Site) => `${site.toLowerCase()}-trees-density`;

// Heatmap radius (px) tuned for plot-scale zooms (~14-18).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PLOT_HEATMAP_RADIUS: any = ["interpolate", ["exponential", 2], ["zoom"], 14, 6, 18, 60];

// MapLibre heatmap-intensity for the dendroband heatmaps: lower it if they
// saturate, raise it if sparse areas are too faint.
const DENDRO_HEATMAP_INTENSITY = 0.5;

export function addTreeDensity(map: Ref<M.Map | null>, site: Site) {
  return addHeatmap(map, treeDensityId(site), dendrobandSourceId(site), {
    beforeId: dendrobandLayerId(site),
    visible: false, // turned on from the layer panel
    paint: {
      "heatmap-radius": PLOT_HEATMAP_RADIUS,
      "heatmap-intensity": DENDRO_HEATMAP_INTENSITY,
    },
  });
}
