import type { ColorMap } from "./types.js";

const colormap: ColorMap = {
  r: [1.0, 1.0],
  g: [1.0, 0.0],
  b: [1.0, 1.0],
};

const esri = {
  "type": "multipart",
  "colorRamps": [
    {
      "type": "algorithmic",
      "fromColor": [
        255,
        255,
        255,
        255
      ],
      "toColor": [
        255,
        0,
        255,
        255
      ],
      "algorithm": "esriCIELabAlgorithm",
      "start": 0.0,
      "stop": 1.0
    }
  ]
};

export default {
  colormap,
  esri,
};
