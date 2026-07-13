<template>
  <draggable 
    v-model="displayOrder" 
    handle=".drag-handle"
    class="layer-order"
    :item-key="(item) => item"
  >
    <template #item="{ element }">
      <div class="layer-order-row">
        <div class="drag-handle">
          <v-icon size="x-small">mdi-menu</v-icon>
        </div>
        <layer-control-item
          :map="mapRef"
          :layer-id="element"
          :display-name="displayNameTransform(element)"
          :synced-items="getConnectedItems(element)"
        >
          <template #warning
            v-if="warningMessage(element)"
          >
            <v-tooltip :text="warningMessage(element)!">
              <template #activator="{ props }">
                <v-icon v-bind="props" color="red">mdi-alert</v-icon>
              </template>
            </v-tooltip>
          </template>
          <template #info
            v-if="layerInfo[element]"
          >
            <h3 v-html="layerInfo[element].title"></h3>
            <p v-html="layerInfo[element].description"></p>
            <p v-if="layerInfo[element].timescale" class="mt-2">Timescale:<span v-html="layerInfo[element].timescale"></span></p>
            <p class="mt-1 text-caption" v-html="layerInfo[element].source"></p>
          </template>
          <template #extras="{ visible }"
          >
            <local-scope
              v-if="element.startsWith(tempoPrefix)"
              :cbar="colorbarOptions[element.slice(tempoPrefix.length)]"
            >
              <template #default="{ cbar }">
                <colorbar-horizontal
                  v-show="visible"
                  :cmap-name="showRGBMode ? cbar.rgbcolormap : cbar.colormap"
                  :cmap="colormapFunction(showRGBMode ? cbar.rgbcolormap : cbar.colormap)"
                  background-color="transparent"
                  height="15px"
                  font-size="9pt"
                  :nsteps="255"
                  :start-value="String((showRGBMode ? cbar.rgbstretch : cbar.stretch)[0] / cbar.cbarScale)"
                  :end-value="String((showRGBMode ? cbar.rgbstretch : cbar.stretch)[1] / cbar.cbarScale)"
                  :extend="false"
                >
                  <template #label>
                    <span v-html="cbarLabel(cbar.cbarScale, cbar.unit)"></span>
                  </template>
                </colorbar-horizontal>
              </template>
            </local-scope>
            <!-- Legend -->

            <NarrowExpansionPanel v-show="visible" :item="element" v-if="hasLegend.includes(element)" :label="element==='power-plants-layer' ? 'Show Filter' : 'Show Legend'">
              <land-use-legend  v-if="element === 'land-use'"  />
              <AQILegend v-if="element === 'aqi-layer-aqi'" />
              <power-plants-filter-control :map="mapRef" v-if="element === 'power-plants-layer'"/>
              <pop-dens-legend v-if="element === 'pop-dens'" mini/>
            </NarrowExpansionPanel>

          </template>
        </layer-control-item>
      </div>
    </template>
  </draggable>
</template>


<script setup lang="ts">
import { computed, type MaybeRef,  toValue, toRef, watch } from 'vue';
import { storeToRefs } from "pinia";
import draggable from 'vuedraggable';
import M from 'maplibre-gl';

import { useMaplibreLayerOrderControl } from "@/composables/useMaplibreLayerOrderControl";
import { capitalizeWords } from "@/utils/names";
import { colorbarOptions } from "@/esri/ImageLayerConfig";
import { colormapFunction } from "@/colormaps/utils";
import { useTempoStore } from "@/stores/app";
import { layerNames, layerInfo } from "@/datasets/layerData";
import NarrowExpansionPanel from './NarrowExpansionPanel.vue';
import LandUseLegend from './LandUseLegend.vue';
import AQILegend from './AQILegend.vue';
import PopDensLegend from './PopDensLegend.vue';


const store = useTempoStore();
const { showRGBMode, layersReady, globalWarning } = storeToRefs(store);

interface Props {
  mapRef: M.Map | null;
  order: MaybeRef<string[]>;
}

const props = defineProps<Props>();
const mapRef = toRef(() => props.mapRef);

// https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits

interface Emits {
  (e: 'change', newOrder: string[]): void;
}
const _emit = defineEmits<Emits>();

  
const connections = {
  'stamen-toner-lines': ['coastline-custom', 'states-custom', 'stamen-toner-lines'],
  'aqi-layer-aqi': ['aqi-layer-aqi','aqi-layer-aqi-label'], // colored dot on bottom, label on top
  'places-asthma-tracts': ['places-asthma-tracts-outline'],
  'places-asthma-counties': ['places-asthma-counties-outline'],
  'hms-fire': ['hms-fire-circle', 'hms-fire-clustered']
};
const getConnectedItems = (layer: string): string[] => {
  return connections[layer] ?? [];
};

const { 
  currentOrder, 
  controller 
} = useMaplibreLayerOrderControl(
  mapRef, 
  toValue(props.order),
  false,
  Object.entries(connections).map(([key, value]) => [key, value])
  
);

const tempoPrefix = "tempo-";

const displayOrder = computed({
  get(): string[] {
    const reversed = currentOrder.value.slice().reverse();
    // Push not ready layers to the bottom, still in order though
    const ready = reversed.filter(id => isLayerReady(id, false));
    const notReady = reversed.filter(id => !isLayerReady(id, false));
    return [...ready, ...notReady];
  },
  set(value: string[]) {
    controller?.setManagedOrder(value.slice().reverse());
  }
});


const hasLegend = ['land-use', 'aqi-layer-aqi', 'power-plants-layer', 'pop-dens'];
const serviceWarning = "The service supporting this layer is down, all or some data may be unavailable.";
// create custom warning for pop-dense, land-use, tempo data. still short but blames the provider
const customServiceWarning = {
  'tempo': "NASA's Earthdata GIS service for this layer is down. See https://gis.earthdata.nasa.gov/ for more information.",
  'pop': "NASA's Earthdata GIS service for this layer is down. See https://gis.earthdata.nasa.gov/ for more information.",
  'land': "ESRI's service for this layer is down. See https://livingatlas.arcgis.com/landcoverexplorer/ for more information.",
};

const _partialServiceWarning = "The service supporting this layer is down, all or some data may be unavailable.";
// create custom warning for pop-dense, land-use, tempo data. still short but blames the provider
const partialCustomServiceWarning = {
  'tempo': "Due to a disruption of NASA's Earthdata GIS service some data may be unavailable. ",
  'pop': "Due to a disruption of NASA's Earthdata GIS service some data may be unavailable. ",
  'land': "Due to a disruption ESRI's service for this layer is down. See https://livingatlas.arcgis.com/landcoverexplorer/ for more information.",
};

function displayNameTransform(layerId: string): string {
  return layerNames[layerId] ?? capitalizeWords(layerId.replace(/-/g, " "));
}

watch(layersReady, () => {
  const notReadyTempoLayers = Array.from(layersReady.value).map(([layerId, ready]) => {
    if (layerId.startsWith('tempo') && (!ready || ready.length === 0 || ready.every(ready => !ready))) {
      return true;
    }
    return false;  
  });
  if (notReadyTempoLayers.some(e => e)) {
    globalWarning.value = `The NASA Earthdata GIS service that this app relies on (at <a style="color:currentColor;" href="https://gis.earthdata.nasa.gov/" target="_blank">https://gis.earthdata.nasa.gov/</a>) is currently down. Certain TEMPO and Population Density data may not be available.<br/><br/>
    An alternate version of TEMPO's NO<sub>2</sub> data layer is displayed here instead.`;
  } else {
    globalWarning.value = '';
  }
}, { deep: true });

// use function overrirde to enforce what can be returned
function isLayerReady(layerId: string, includePartial: true): true | {ready: boolean, partial: boolean};
// eslint-disable-next-line no-redeclare
function isLayerReady(layerId: string, includePartial: false): boolean;
// eslint-disable-next-line no-redeclare
function isLayerReady(layerId: string, includePartial = false) {
  // tract layers use [false] to signal zoom-in, not a service outage — always treat as positioned-ready
  if (layerId.includes('tracts')) return true;
  const readiness = layersReady.value.get(layerId);
  if (!readiness || readiness.length === 0) {
    return true; // was null, no warning message, so true
  }
  if (includePartial) {
    return {
      ready: readiness.every(ready => ready),
      partial: readiness.some(ready => ready) && !readiness.every(ready => ready)
    };
  }
  return readiness.every(ready => ready); // actually have to check
}


function warningMessage(layerId: string): string | null {
  // [false] for tracts means zoom-in required, not a service failure — check before isLayerReady
  if (layerId.includes('tracts')) {
    const readiness = layersReady.value.get(layerId);
    return (readiness && !readiness.every(r => r)) ? 'Zoom in to see census tract data' : null;
  }
  const ready = isLayerReady(layerId, true);
  // if ready is truthy, no error message
  if (ready === true || ready.ready === true) {
    return null;
  }

  // return serviceWarning;
  if (layerId.startsWith('tempo')) {
    return ready.partial ? partialCustomServiceWarning['tempo'] : customServiceWarning['tempo'];
  } else if (layerId.startsWith('pop')) {
    return ready.partial ? partialCustomServiceWarning['pop'] : customServiceWarning['pop'];
  } else if (layerId.startsWith('land')) {
    return ready.partial ? partialCustomServiceWarning['land'] : customServiceWarning['land'];
  } else {
    return ready.partial ? _partialServiceWarning : serviceWarning;
  }
}


function cbarLabel(cbarScale: number, unit: string) {
  const power = cbarScale > 1 ? `10<sup>${Math.round(Math.log10(cbarScale))}</sup>` : "";
  return `${power} ${unit}`;
}
</script>


<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  margin-left: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: fit-content;
}

li {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  cursor: move;
  margin: 10px 0;
}

.drag-handle {
  font-size: 20pt;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  &:hover {
    cursor: grab;
  }
}

.layer-order {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layer-order-row {
  background: #404040;
  border: 1px solid white;
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.mlc-layer-item {
  border-left: 1px solid white;
  padding: 2px;
}

#power-plant-filter-controls {
  box-sizing: border-box;
}
</style>
