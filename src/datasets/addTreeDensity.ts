import type { Ref } from "vue";
import type M from "maplibre-gl";
import { addHeatmap } from "./addHeatmap";
import { DENDROBAND_LAYER_ID, DENDROBAND_SOURCE_ID } from "./addDendrobands";

// Density of dendroband trees, one count per stem. It reads the dendroband
// source, which has one point per stem per year, so give it the same filter as
// the points (setFilter) or every stem is counted once per year.
export const TREE_DENSITY_ID = "scbi-trees-density";

export function addTreeDensity(map: Ref<M.Map | null>) {
  return addHeatmap(map, TREE_DENSITY_ID, DENDROBAND_SOURCE_ID, {
    beforeId: DENDROBAND_LAYER_ID,
    visible: false, // turned on from the layer panel
    paint: {
      // tuned for plot-scale zooms (~14-18)
      "heatmap-radius": ["interpolate", ["exponential", 2], ["zoom"], 14, 6, 18, 60],
    },
  });
}
