import type { Ref } from "vue";
import type M from "maplibre-gl";
import { useGeotiff } from "@/composables/useGeotiff";
import { DENDROBAND_LAYER_ID } from "./addDendrobands";

// LiDAR bare-earth DEM of the SERC ForestGEO plot (Edgewater, MD).
// Made from SERC_MDLiDAR_m_ForestGEO_plot.tif by public/reproject_geotiff.ipynb
// (EPSG:3857, the source's 0 fill treated as nodata). Values are ~0-13 m.
export const SERC_ELEVATION_ID = "serc-elevation";
export const SERC_ELEVATION_RANGE: [number, number] = [0, 13];

export function addSercElevation(map: Ref<M.Map | null>) {
  return useGeotiff(map, SERC_ELEVATION_ID, "serc_dem_3857.tif", {
    colormap: "CartoEarth",
    range: SERC_ELEVATION_RANGE,
    reverse: true, // low ground blue-green, high ground brown
    attribution: "Elevation: Maryland LiDAR via SERC ForestGEO",
    beforeId: DENDROBAND_LAYER_ID,
  });
}
