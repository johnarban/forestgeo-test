// Convert a MapLibre heatmap's density into physical units (count per m²).
//
// MapLibre's heatmap kernel (maplibre-gl src/shaders/heatmap.{vertex,fragment}.glsl):
// each point adds   weight * intensity * G * exp(-4.5 (r/R)²),   G = 1/sqrt(2π),
// where R is heatmap-radius (a Gaussian with σ = R/3), cut off where that falls
// below ZERO = 1/255/16. For points at a uniform areal density ρ (count/m²) and
// R in meters, the summed heatmap-density is
//   D = ρ · R² · (2π/9) · (weight·intensity·G − ZERO)
// so with weight 1, D and ρ are proportional, and D = 1 (the top of the color
// scale) is ρ = 1 / (R² · (2π/9) · (intensity·G − ZERO)). For real (clumpy)
// points this is the density smoothed over that Gaussian.

const GAUSS_COEF = 1 / Math.sqrt(2 * Math.PI);
const ZERO = 1 / 255 / 16;
const KERNEL_AREA = (2 * Math.PI) / 9; // ∫ exp(-4.5 v²) dA, v in units of R
const EARTH_CIRCUMFERENCE = 2 * Math.PI * 6378137; // m (Web Mercator)
const TILE_SIZE = 512; // MapLibre's world is 512 px wide at zoom 0

export function metersPerPixel(zoom: number, lat: number): number {
  return (EARTH_CIRCUMFERENCE * Math.cos((lat * Math.PI) / 180)) / (TILE_SIZE * 2 ** zoom);
}

// Evaluate a number or a zoom interpolation like
// ["interpolate", ["exponential", 2] | ["linear"], ["zoom"], z0, v0, z1, v1, ...]
// the same way MapLibre does. Returns null for anything else.
export function evaluateZoomExpression(value: unknown, zoom: number): number | null {
  if (typeof value === "number") { return value; }
  if (!Array.isArray(value) || value[0] !== "interpolate") { return null; }
  const [, interp, input, ...stops] = value;
  if (!Array.isArray(input) || input[0] !== "zoom" || !Array.isArray(interp)) { return null; }
  const base = interp[0] === "linear" ? 1 : interp[0] === "exponential" ? Number(interp[1]) : NaN;
  if (!Number.isFinite(base) || stops.length < 2 || stops.some((s) => typeof s !== "number")) { return null; }
  const zs = stops.filter((_, i) => i % 2 === 0) as number[];
  const vs = stops.filter((_, i) => i % 2 === 1) as number[];
  if (zoom <= zs[0]) { return vs[0]; }
  if (zoom >= zs[zs.length - 1]) { return vs[vs.length - 1]; }
  const i = zs.findIndex((z, j) => zoom >= z && zoom < zs[j + 1]);
  const diff = zs[i + 1] - zs[i];
  const progress = zoom - zs[i];
  const t = base === 1 ? progress / diff : (base ** progress - 1) / (base ** diff - 1);
  return vs[i] + t * (vs[i + 1] - vs[i]);
}

/** heatmap-radius (a number or zoom expression, in px) in meters at this zoom/latitude. */
export function heatmapRadiusMeters(radius: unknown, zoom: number, lat: number): number | null {
  const px = evaluateZoomExpression(radius, zoom);
  return px === null ? null : px * metersPerPixel(zoom, lat);
}

/** count/m² that maps to heatmap-density 1 (the top of the color scale). */
export function densityAtTop(intensity: number, radiusMeters: number): number {
  return 1 / (radiusMeters ** 2 * KERNEL_AREA * (intensity * GAUSS_COEF - ZERO));
}

/** heatmap-intensity that puts `maxDensity` (count/m²) at the top of the color scale. */
export function intensityForMaxDensity(maxDensity: number, radiusMeters: number): number {
  return (1 / (maxDensity * radiusMeters ** 2 * KERNEL_AREA) + ZERO) / GAUSS_COEF;
}
