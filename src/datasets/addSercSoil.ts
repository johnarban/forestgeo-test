import type { Ref } from "vue";
import type M from "maplibre-gl";
import { useGeotiff } from "@/composables/useGeotiff";
import { DENDROBAND_LAYER_ID } from "./addDendrobands";

// 2012 soil moisture map of the SERC ForestGEO plot (Edgewater, MD), 1 m grid.
// Made from SERC_soil_moisture_2012.tif by public/reproject_geotiff.ipynb (EPSG:3857).
// Values run ~11-98 (mean ~30); units aren't recorded in the file, likely % volumetric.
export const SERC_SOIL_ID = "serc-soil";
export const SERC_SOIL_RANGE: [number, number] = [10, 60];

export function addSercSoil(map: Ref<M.Map | null>) {
  return useGeotiff(map, SERC_SOIL_ID, "serc_soil_moisture_2012_3857.tif", {
    colormap: "BrewerBlues9",
    range: SERC_SOIL_RANGE,
    attribution: "Soil moisture: SERC ForestGEO",
    beforeId: DENDROBAND_LAYER_ID,
  });
}
