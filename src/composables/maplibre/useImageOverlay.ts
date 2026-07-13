import {ref, Ref, watch, onUnmounted, toValue, toRef} from 'vue';
import { BoundingBox } from '../../types';
import M from 'maplibre-gl';



export interface MaplibreImageOverlayComposable {
  overlay: Ref<M.ImageSource | null>;
  addTo: (map: M.Map) => void;
}

export function useImageOverlay(
  imageUrl: Ref<string> | string, 
  opacity: Ref<number> | number,
  imageBounds: Ref<BoundingBox>,
  overlayId='image-overlay',
): MaplibreImageOverlayComposable {
  
  imageUrl = toRef(imageUrl);
  opacity = toRef(opacity);
  imageBounds = toRef(imageBounds);
  const overlay = ref<M.ImageSource | null>(null);
  
  const layer: M.LayerSpecification = {
    id: overlayId,
    type: "raster",
    source: overlayId,
    paint: {
      'raster-opacity': toValue(opacity),
      'raster-fade-duration': 0,
      'raster-resampling': 'nearest',
    }
  };
  
  
  function toMaplibreBounds(boundingBox: BoundingBox): M.Coordinates {
    // Four geographical coordinates, represented as arrays of 
    // longitude and latitude numbers, which define the corners of the image. 
    // The coordinates start at the top left corner of the image and proceed in 
    // clockwise order. They do not have to represent a rectangle.
    // TL -> TR -> BR -> BL (NW, NE, SE, NW) [long, lat]
    return [
      [
        boundingBox.west, 
        boundingBox.north
      ], // top-left
      [
        boundingBox.east, 
        boundingBox.north
      ], // top-right
      [
        boundingBox.east, 
        boundingBox.south
      ], // bottom-right
      [
        boundingBox.west, 
        boundingBox.south
      ], // bottom-left
    ];
  }
  
  function addSource(map: M.Map) {
    map.addSource(overlayId,
      {
        type: "image",
        url: toValue(imageUrl),
        coordinates: toMaplibreBounds(imageBounds.value),
      } 
    );
    return map.getSource(overlayId);
  }
  
  function addLayer(map: M.Map) {
    map.addLayer(layer, 'stamen-toner-labels');
    return map.getLayer(overlayId);
  }
  
  function addTo(map: M.Map) {
    map.on('style.load', () => {
      const source = addSource(map);
      addLayer(map);
      
      if (source !== undefined) {
        overlay.value = source as M.ImageSource;
        configureOverlay();
      }
    });
  }
  
  function updateOrClearImage(url: string) {
    if (url && overlay.value) {
      overlay.value.updateImage({url: url});
      if (!overlay.value.map.getLayer(overlayId)) {
        overlay.value.map.addLayer(layer, 'stamen-toner-labels');
      }
    } else if (overlay.value) {
      overlay.value.map.removeLayer(overlayId);
    }
    
  }
  
  watch(imageUrl, (url: string) => {
    updateOrClearImage(url);
  });

  watch(opacity, (value: number) => {
    if (overlay.value) {
      overlay.value.map.setPaintProperty(overlayId, 'raster-opacity', value);
    }
  });

  watch(imageBounds, (bounds: BoundingBox) => {
    if (overlay.value) {
      overlay.value.setCoordinates(toMaplibreBounds(bounds));
    }
  });
  
  function configureOverlay() {
    if (overlay.value) {
      overlay.value.map.setPaintProperty(overlayId, 'raster-fade-duration', 0);
    }
  }
  
  
  
  

  onUnmounted(() => {
    if (overlay.value) {
      overlay.value.map.removeLayer(overlayId).removeSource(overlayId);
    }
  });
  
  return { overlay, addTo} as MaplibreImageOverlayComposable;

}