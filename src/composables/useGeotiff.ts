import type { Ref } from "vue";
import M from "maplibre-gl";
import { cogProtocol, locationValues } from "@geomatico/maplibre-cog-protocol";

// Shows a single-band Cloud Optimized GeoTIFF as a color-ramped raster layer.
// geotiff.js (via maplibre-cog-protocol) reads the file in the browser and cuts
// it into map tiles, so no tile server is needed.
//
// The COG must be in EPSG:3857. Make one with public/reproject_geotiff.ipynb.
// Nodata/NaN pixels render transparent.
// https://maplibre.org/maplibre-gl-js/docs/examples/add-a-cog-raster-source/

let protocolAdded = false;

export interface GeotiffOptions {
  colormap: string; // a built-in ramp, e.g. "BrewerBlues9" (https://labs.geomatico.es/maplibre-cog-protocol/color-cheatsheet.html)
  range: [number, number]; // data values mapped to the ends of the ramp
  reverse?: boolean; // flip the ramp
  opacity?: number;
  attribution?: string;
  beforeId?: string; // layer to insert beneath
}

export function useGeotiff(map: Ref<M.Map | null>, id: string, path: string, options: GeotiffOptions) {
  // absolute, so the cog:// handler and locationValues fetch the same file
  const url = new URL(path, document.baseURI).href;
  const { colormap, range, reverse = false, opacity = 0.8, attribution, beforeId } = options;

  function init() {
    const m = map.value;
    if (!m) { return; }
    if (!protocolAdded) {
      M.addProtocol("cog", cogProtocol);
      protocolAdded = true;
    }
    if (!m.getSource(id)) {
      m.addSource(id, {
        type: "raster",
        url: `cog://${url}#color:${colormap},${range[0]},${range[1]},c${reverse ? "-" : ""}`,
        tileSize: 256,
        attribution,
      });
    }
    if (!m.getLayer(id)) {
      m.addLayer({
        id,
        type: "raster",
        source: id,
        paint: { "raster-opacity": opacity, "raster-resampling": "nearest" },
      }, beforeId && m.getLayer(beforeId) ? beforeId : undefined);
    }
  }

  /** The raster value at a point, or null outside the data. */
  async function valueAt(lngLat: M.LngLatLike): Promise<number | null> {
    const { lng, lat } = M.LngLat.convert(lngLat);
    const [value] = await locationValues(url, { latitude: lat, longitude: lng });
    return Number.isNaN(value) ? null : value;
  }

  return { id, init, valueAt };
}
