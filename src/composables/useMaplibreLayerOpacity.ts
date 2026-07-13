import { Map } from "maplibre-gl";
import { ref, watch } from "vue";

import { getLayerOpacity, setLayerOpacity } from "@/maplibre_controls";

export function useMaplibreLayerOpacity(
  map: Map,
  layerId: string,
  initialOpacity?: number,
) {
  const opacity = ref(initialOpacity ?? getLayerOpacity(map, layerId));
  watch(opacity, (value: number) => setLayerOpacity(map, layerId, value), { immediate: true });
  map.on("styledata", () => {
    opacity.value = getLayerOpacity(map, layerId);
  });

  return {
    opacity,
  };
}
