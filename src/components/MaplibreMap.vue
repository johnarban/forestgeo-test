<template>
  <!-- this will automatically gets the class maplibregl-map added to it -->
  <div :id="mapID" class="tempo-map" :style="{ '--width': width, '--height': height }">
    <slot></slot>
  </div>
</template>
  
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { LatLngPair, InitMapOptions } from "@/types";
import type { PropType } from 'vue';
import type { Map, MapEventType, Listener } from 'maplibre-gl';
import { useMap } from "@/composables/maplibre/useMap";
import { usezoomhome } from '@/composables/maplibre/useZoomHome';


// should be using a defined Prop type and widthDefaults, but 
// i could not get that to work with the center (LatLngPair is a weird type)
// but apparently the old options syntax is still good
const props = defineProps({
  mapID: {
    type: String as PropType<string>,
    required: true
  },
  home: {
    type: Object as PropType<InitMapOptions>,
    required: false,
    default: () => {
      return {
        loc: [39.8283, -98.5795] as LatLngPair, 
        zoom: 4, 
        t: null
      };
    }
  },
  initial: {
    type: Object as PropType<InitMapOptions | null>,
    required: false,
    default: null
  },
  showRoads: {
    type: Boolean,
    required: false,
    default: true
  },
  // events: { moveend: handler, zoomend: handler, click: handler, etc. }
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Object as PropType<Record<keyof MapEventType | string, Listener>>,
    default: () => ({})
  },
  // width and height, default to 100%
  width: {
    type: String,
    required: false,
    default: '100%'
  },
  height: {
    type: String,
    required: false,
    default: '100%'
  }
});

// define model values that set and return the current map center and zoom
const latitude = defineModel<number>(
  'latitude', 
  {
    default: 0
  });
const longitude = defineModel<number>(
  'longitude', 
  {
    default: 0
  });
const zoom = defineModel<number>(
  'zoom', 
  {
    default: 0
  });




const showRoadsRef = ref(props.showRoads);
watch(() => props.showRoads, (value) => {
  showRoadsRef.value = value;
});

const emit = defineEmits<{
  (e: 'ready', map: Map): void;
  (e: 'zoomhome'): void;
}>();






function attachAllEvents(m: Map, handlers: typeof props.events) {
  Object.entries(handlers).forEach(([evt, handler]) => {
    m.on(evt, handler);
  });
}

function detachAllEvents(m: Map, handlers: typeof props.events) {
  Object.entries(handlers).forEach(([evt, handler]) => {
    m.off(evt, handler);
  });
}

const mapReady = ref(false);
// https://stackoverflow.com/a/36072263/11594175
let promiseResolve: (value: Map) => void;
// let promiseReject: (reason?: any) => void; // we won't use the reject
const whenMapReady: Promise<Map> = new Promise((resolve, _reject) => {
  promiseResolve = resolve; /**   this is just javascript, so this pulls 
                                  the resolve function
                                  out of the promise constructor and makes it 
                                  available for us to use
                            **/
  // promiseReject = reject;
});

const onMapReady = (m: Map) => {
  console.log("Map is ready - Map ID: ", m._getMapId());
  mapReady.value = true;
  emit('ready', m);
  promiseResolve(m);
  attachAllEvents(m, props.events);
};

const {
  map,
  createMap,
  setView,
  resetView,
  getCenter,
  cleanupMap
} = useMap(props.mapID, props.initial ?? props.home, showRoadsRef, onMapReady);

watch(() => [latitude.value, longitude.value, zoom.value], ([newLat, newLng, newZoom]) => {
  if (map.value && mapReady.value) {
    setView([newLat, newLng] as LatLngPair, newZoom);
  }
});

onMounted(() => {

  const mMap = createMap(); // just use the return value instead of map.value. eases type checking
  
  usezoomhome(mMap, props.home.loc, props.home.zoom, () => {
    emit('zoomhome');
  });

  mMap.value.on('moveend', () => {
    if (map.value) {
      const center = map.value.getCenter();
      latitude.value = center.lat;
      longitude.value = center.lng;
      zoom.value = map.value.getZoom();
    }
  });
  
});

onBeforeUnmount(() => {
  if (map.value) {
    detachAllEvents(map.value, props.events);
    cleanupMap();
  }
});


// provide only works downwards and i don't think we need it
// const MAPLIBRE_PROVIDE_KEY = props.mapID;
// provide(MAPLIBRE_PROVIDE_KEY, 
const exposedMapApi = {
  map,
  setView,
  resetView,
  getCenter,
  on: (evt: keyof MapEventType | string, handler: Listener) => {
    if (map.value) {
      map.value.on(evt, handler);
    }
  },
  off: (evt: keyof MapEventType | string, handler: Listener) => {
    if (map.value) {
      map.value.off(evt, handler);
    }
  },
  once: (evt: keyof MapEventType | string, handler: Listener) => {
    if (map.value) {
      map.value.once(evt, handler);
    }
  },
  mapReady,
  onReady: whenMapReady
};

// we will also expose these on the template ref
defineExpose(exposedMapApi);



</script>
  
<style lang="less">

.tempo-map {
  width: var(--width);
  height: var(--height);
}

.tempo-map canvas.maplibregl-canvas {
  background-color: whitesmoke;
}

</style>

