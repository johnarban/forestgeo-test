import {ref, watch, Ref, onUnmounted} from 'vue';


import fieldOfRegard from "@/assets/TEMPO_FOR.json";
import augustFieldOfRegard from "@/assets/august_for.json";


import M from 'maplibre-gl';

export interface MaplibreFieldOfRegardComposable {
  addFieldOfRegard: () => void;
  showFieldOfRegard: Ref<boolean>;
  updateFieldOfRegard: () => void;
  fieldOfRegardLayer: Ref<M.GeoJSONSource | null>;
}

export function useFieldOfRegard(
  date: Ref<Date | null>,
  map: Ref<M.Map | null>
): MaplibreFieldOfRegardComposable {

  const showFieldOfRegard = ref(true);
  let usingAugust = true as boolean | null;
  const fieldOfRegardLayer = ref<M.GeoJSONSource | null>(null);
  const fieldOfRegardLayerId = 'field-of-regard';


  function createFoRLayer() {
    if (!map.value) {
      console.warn("Map is not initialized, cannot create Field of Regard layer.");
      return;
    }
    // Create the Source if it doesn't exist
    let source = map.value.getSource(fieldOfRegardLayerId);
    if (source === undefined) {
      map.value.addSource(fieldOfRegardLayerId, {
        'type': 'geojson',
        data: fieldOfRegard as GeoJSON.GeometryCollection,
      });

      source = map.value.getSource(fieldOfRegardLayerId);
    }

    // Create the layer if it doesn't exist
    let layer = map.value.getLayer(fieldOfRegardLayerId);
    if (layer === undefined) {
      map.value.addLayer({
        id: fieldOfRegardLayerId,
        type: 'line',
        source: fieldOfRegardLayerId,
        paint: {
          "line-color": "#c10124",
          "line-width": 1,
          "line-opacity": 0.8,
        }
      });

      layer = map.value.getLayer(fieldOfRegardLayerId);
    }

    if (source) {
      fieldOfRegardLayer.value = source as M.GeoJSONSource;
    }
  }

  function clearFoR() {
    if (fieldOfRegardLayer.value) {
      if (fieldOfRegardLayer.value.map.getLayer(fieldOfRegardLayerId)) {
        fieldOfRegardLayer.value.map
          .removeLayer(fieldOfRegardLayerId)
          .removeSource(fieldOfRegardLayerId);
      }
    }
  }


  function updateFieldOfRegard() {

    if (date.value !== null && date.value.getUTCFullYear() === 2023 && date.value.getUTCMonth() === 7) {
      fieldOfRegardLayer.value?.setData(augustFieldOfRegard as GeoJSON.GeometryCollection);
      usingAugust = true;
    } else {
      if (usingAugust) { // only want this to run if it has to
        fieldOfRegardLayer.value?.setData(fieldOfRegard as GeoJSON.GeometryCollection);
        usingAugust = false;
      }
    }
  }

  function addFieldOfRegard() {
    if (showFieldOfRegard.value && map.value) {
      if (map.value.loaded()) {
        createFoRLayer();
      } else {
        // style.load as already fired depending on where this is placed
        // so we use 'load' event of the map itself
        map.value.on('load', () => {
          createFoRLayer();
        });
      }
    }
  }

  watch(showFieldOfRegard, (show: boolean) => {
    if (show) {
      createFoRLayer();
    } else if (map.value) {
      clearFoR();
    }
  });

  watch(date, updateFieldOfRegard);


  onUnmounted(() => {
    if (map.value) {
      clearFoR();
    }
  });

  return {
    addFieldOfRegard,
    showFieldOfRegard,
    updateFieldOfRegard,
    fieldOfRegardLayer: fieldOfRegardLayer as Ref<M.GeoJSONSource | null>,
  };
}
