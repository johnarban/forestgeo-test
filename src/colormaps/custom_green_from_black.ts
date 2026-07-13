import type { ColorMap } from "./types.js";

const colormap: ColorMap = {
  r: [0.0, 0.0],
  g: [0.0, 1.0],
  b: [0.0, 0.0],
};

const esri = {
  "type": "multipart",
  "colorRamps": [
    {
      "type": "algorithmic",
      "fromColor": [
        0,
        0,
        0,
        255
      ],
      "toColor": [
        0,
        255,
        0,
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
