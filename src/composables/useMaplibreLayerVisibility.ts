import { Map } from "maplibre-gl";
import { ref, watch } from "vue";

import { getLayerVisibility, setLayerVisibility } from "@/maplibre_controls";

export function useMaplibreLayerVisibility(
  map: Map,
  layerId: string,
  initialVisibility?: boolean,
) {
  const visible = ref(initialVisibility ?? getLayerVisibility(map, layerId));
  watch(visible, (value: boolean) => setLayerVisibility(map, layerId, value), { immediate: true });
  map.on("styledata", () => {
    visible.value = getLayerVisibility(map, layerId);
  });

  return {
    visible,
  };
}
