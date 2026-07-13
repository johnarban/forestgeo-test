import { Ref } from 'vue';
import maplibregl from 'maplibre-gl';

export interface MultiMarkerOptions {
  label?: string;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  opacity?: number;
  radius?: number;
  outlineColor?: string;
  paint?: maplibregl.CircleLayerSpecification['paint'];
  layout?: maplibregl.CircleLayerSpecification['layout'];
  shape?: 'circle' | 'marker';
  scale?: 'world' | 'screen';
  visible?: boolean;
}


const DEG_DEFAULT = 0.05; // example default: 0.05°
const PX_DEFAULT  = 8;

  
function toGeoJSON(points: Array<{ x: number; y: number }>, radius_deg?: number): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map(pt => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pt.x, pt.y] } as GeoJSON.Point,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        radius_deg: radius_deg ?? DEG_DEFAULT,
        // the below are unused, but useful if we want something different in the future
        // eslint-disable-next-line @typescript-eslint/naming-convention
        radius_px: PX_DEFAULT,
        lat: pt.y,
        lon: pt.x,
      },
    })),
  };
}

export function useMultiMarker(map: Ref<maplibregl.Map | null>, options: MultiMarkerOptions = {}) {
  const sourceId = `${options.label ?? 'multi-marker'}-source`;
  const layerId = `${options.label ?? 'multi-marker'}-layer`;
  
  options.scale = options.scale ?? 'screen';
  
  function optionsToPaint() {
    return {
      // 'circle-radius': options.radius ?? 8,
      'circle-color': options.fillColor ?? options.color ?? '#ff0000',
      'circle-opacity': options.fillOpacity ?? options.opacity ?? 0.8,
      'circle-stroke-color': options.outlineColor ?? options.color ?? '#000',
      'circle-stroke-width': 2
    };
  }

  function addMarkers(points: Array<{ x: number; y: number }>) {
    if (!map.value) return;
    clearMarkers();
    const geojson = toGeoJSON(points, options.scale === 'world' ? (options.radius ?? DEG_DEFAULT) : options.radius ?? PX_DEFAULT);
    if (map.value.getSource(sourceId)) {
      (map.value.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.value.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });
    }
    if (!map.value.getLayer(layerId)) {
      
      const paint = {
        ...optionsToPaint(),
        ...(options.paint ?? {}),
      };
      
      if (options.scale === 'screen') {
        paint['circle-radius'] = options.radius ?? PX_DEFAULT;
        paint['circle-pitch-scale'] = 'viewport'; // stays in screen pixels even when pitched
      } else {
        // use a maplibre expression to avoid js handlers. https://maplibre.org/maplibre-style-spec/expressions/#zoom

        // conversion from degrees to pixels at equator at zoom = 0
        // Explanation: at zoom = 0
        // 360 degrees = 256 pixels @ equator. we will ignore latitude scaling.
        // to include latitude scaling, multiply radius by cos(lat) where lat is in radians
        // after testing, a slightly smaller factor seems to work better visually
        const degreeToPixel = 512 / 360; // typically we would use 256 but maplibre-gl uses 2x the resolution
        
        paint['circle-radius'] = [
          // pixel scale is dependent on zoom ~ 2^zoom
          // https://leafletjs.com/examples/zoom-levels/ (zoom explainer from leaflet)
          'interpolate', ['exponential', 2], ['zoom'],
          // at zoom = 0, the pixel radius = radius in degrees * K
          0,  ['*', ['get', 'radius_deg'], degreeToPixel],
          // at zoom = 24  (or whatever max zoom your style uses)
          24, ['*', ['get', 'radius_deg'], degreeToPixel * Math.pow(2, 24)]
        ];
        paint['circle-pitch-scale'] = 'viewport'; // stays in screen pixels even when pitched
      }
      
      
      
      const visible = options.visible ?? true;
      map.value.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: paint,
        layout: options.layout ?? {
          visibility: visible ? "visible" : "none",
        },
      } as maplibregl.CircleLayerSpecification);
    }
  }

  function clearMarkers() {
    if (!map.value) return;
    if (map.value.getLayer(layerId)) {
      map.value.removeLayer(layerId);
    }
    if (map.value.getSource(sourceId)) {
      map.value.removeSource(sourceId);
    }
  }

  return { addMarkers, clearMarkers };
}
