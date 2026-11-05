<template>
  <colorbar-horizontal
    v-if="top !== null"
    :cmap="cmap"
    :nsteps="100"
    start-value="0"
    :end-value="showUnit ? format(top) : '1'"
    :extend="false"
    background-color="transparent"
    height="12px"
    font-size="9pt"
    :label="showUnit ? 'count/m²' : ''"
    :title="showUnit ? `Points per m², smoothed over ~${sigma.toFixed(0)} m. The range changes with zoom.` : undefined"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Map } from "maplibre-gl";
import { densityAtTop, evaluateZoomExpression, heatmapRadiusMeters } from "@/datasets/heatmapUnits";

// Colorbar for a heatmap layer, using the layer's own heatmap-color. By default
// it is labeled in MapLibre's native heatmap-density, 0 to 1 across the ramp.
// With `showUnit` it is labeled in count/m² instead (see heatmapUnits.ts), worked
// out from the layer's heatmap-radius/-intensity at the current zoom and
// latitude, so it follows the zoom and filter changes.
// Renders nothing for layers that aren't heatmaps.

const props = withDefaults(defineProps<{ map: Map; layerId: string; showUnit?: boolean }>(), {
  showUnit: false,
});

const top = ref<number | null>(null); // count/m² at the top of the color scale
const sigma = ref(0); // m, the kernel's Gaussian σ (R/3)
const cmap = ref<(t: number) => string>(() => "transparent");
let colorKey = "";

const DEFAULT_RADIUS = 30; // MapLibre's defaults when a paint property isn't set
const DEFAULT_INTENSITY = 1;

function parseColor(c: unknown): [number, number, number, number] | null {
  const m = typeof c === "string" && c.match(/rgba?\(([^)]+)\)/);
  if (!m) { return null; }
  const [r, g, b, a = 1] = m[1].split(",").map(Number);
  return [r, g, b, a];
}

// heatmap-color is ["interpolate", ["linear"], ["heatmap-density"], t0, color0, ...].
// MapLibre blends colors premultiplied by alpha, so do the same here.
function colorFunction(expr: unknown): ((t: number) => string) | null {
  if (!Array.isArray(expr) || expr[0] !== "interpolate") { return null; }
  const stops: [number, [number, number, number, number]][] = [];
  for (let i = 3; i + 1 < expr.length; i += 2) {
    const color = parseColor(expr[i + 1]);
    if (typeof expr[i] !== "number" || !color) { return null; }
    stops.push([expr[i], color]);
  }
  return (t: number) => {
    const j = stops.findIndex(([s]) => s >= t);
    const [t1, c1] = stops[j === -1 ? stops.length - 1 : j];
    const [t0, c0] = stops[Math.max((j === -1 ? stops.length : j) - 1, 0)];
    const f = t1 === t0 ? 1 : Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
    const a = c0[3] + f * (c1[3] - c0[3]);
    if (a <= 0) { return "rgba(0,0,0,0)"; }
    const ch = (k: number) => Math.round((c0[k] * c0[3] + f * (c1[k] * c1[3] - c0[k] * c0[3])) / a);
    return `rgba(${ch(0)},${ch(1)},${ch(2)},${a.toFixed(3)})`;
  };
}

function update() {
  const m = props.map;
  const layer = m.getLayer(props.layerId);
  if (layer?.type !== "heatmap") { top.value = null; return; }
  const zoom = m.getZoom();
  const radius = heatmapRadiusMeters(m.getPaintProperty(props.layerId, "heatmap-radius") ?? DEFAULT_RADIUS, zoom, m.getCenter().lat);
  const intensity = evaluateZoomExpression(m.getPaintProperty(props.layerId, "heatmap-intensity") ?? DEFAULT_INTENSITY, zoom);
  if (radius === null || intensity === null) { top.value = null; return; }
  top.value = densityAtTop(intensity, radius);
  sigma.value = radius / 3;

  const colorExpr = m.getPaintProperty(props.layerId, "heatmap-color");
  const key = JSON.stringify(colorExpr);
  if (key !== colorKey) {
    colorKey = key;
    cmap.value = colorFunction(colorExpr) ?? (() => "gray");
  }
}

// 2 significant figures, without exponents for small values
function format(x: number): string {
  return Number(x.toPrecision(2)).toString();
}

onMounted(() => {
  props.map.on("move", update);
  props.map.on("styledata", update); // layer added, intensity changed by a filter
  update();
});
onBeforeUnmount(() => {
  props.map.off("move", update);
  props.map.off("styledata", update);
});
watch(() => props.layerId, update);
</script>
