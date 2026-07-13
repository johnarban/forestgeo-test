export type EsriGeometryType = 'esriGeometryPoint' | 'esriGeometryMultipoint' | 'esriGeometryPolyline' | 'esriGeometryPolygon' | 'esriGeometryEnvelope';

export type RectBounds = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

export type PointBounds = {
  x: number;
  y: number;
};
export function rectangleToGeometry(rect: RectBounds) {
  const { xmin, ymin, xmax, ymax } = rect;
  return {
    rings: [[
      [xmin, ymin],
      [xmin, ymax],
      [xmax, ymax],
      [xmax, ymin],
      [xmin, ymin]
    ]],
    spatialReference: { wkid: 4326 } // Assuming WGS 84
    // spatialReference: { wkid: 3857 } // Web Mercator. idk if this really matters for points
  };
}

export function pointToGeometry(point: PointBounds) {
  const { x, y } = point;
  return {
    x: x,
    y: y,
    spatialReference: { wkid: 4326 } // Assuming WGS 84
    // spatialReference: { wkid: 3857 } // Web Mercator. idk if this really matters for points
  };
}