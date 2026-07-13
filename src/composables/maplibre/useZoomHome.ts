import { Ref, ref, watch } from 'vue';
import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CDSMaplibreHomeTool } from './MaplibreHomeTool';
import { LatLngPair, LngLatPair } from '@/types';

export function usezoomhome(map: Ref<Map | null>, home: LatLngPair, zoom: number, callback: CallableFunction = () => null) {

  const startingCenter = [home[1], home[0]] as LngLatPair;
  const zoomHome: Ref<null | CDSMaplibreHomeTool> = ref(null);
  

  
  function createControl() {
    const control = new CDSMaplibreHomeTool(startingCenter, zoom, callback);
    return control;
  }
  
  
  if (map.value !== null) {
    map.value.addControl(new NavigationControl({showCompass: false}), 'top-left');
    zoomHome.value = createControl();
    map.value.addControl(zoomHome.value, 'top-left');
  }
  
  watch(map, (newValue) => {
    if (newValue !== null) {
      newValue.addControl(new NavigationControl({showCompass: false}), 'top-left');
      zoomHome.value = createControl();
      newValue.addControl(zoomHome.value, 'top-left');
    }
  });
  
  
  return zoomHome.value;

}
