import type { ColorMap } from "./types";
import { colormaps, type AllAvailableColorMaps } from ".";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// linear spline
function spline( t: number, ...values: number[]): number {
  if (t <= 0) return values[0] as number;
  if (t >= 1) return values[values.length - 1] as number;
  const n = values.length - 1;
  const i = Math.floor(t * n);
  const u = t * n - i;
  return lerp(values[i], values[i + 1] ?? values[i], u);
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export function colormap(cmap: AllAvailableColorMaps, cmin: number, cmax: number, val: number): [number, number, number]
{ 
  let reversed = false;
  if (cmap.endsWith('_r')) {
    cmap = cmap.slice(0, -2) as AllAvailableColorMaps;
    reversed = true;
  }
  if (!(cmap in colormaps)) {
    console.log(`Colormap ${cmap} not found, returning gray`);
    return [128,128,128];
  }
  
  const { r: redValues, g: greenValues, b: blueValues } = colormaps[cmap] as ColorMap;

  // const normalizedVal = clamp((val-cmin)/(cmax-cmin),0,1);
  const normalizedVal = reversed ? clamp((cmax - val) / (cmax - cmin), 0, 1) : clamp((val - cmin) / (cmax - cmin), 0, 1);
  const r = spline(normalizedVal, ...redValues);
  const g = spline(normalizedVal, ...greenValues);
  const b = spline(normalizedVal, ...blueValues);
  return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
}

export function sampleColormap(cmap: AllAvailableColorMaps, steps: number): number[][] {
  const colors: number[][] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    colors.push(colormap(cmap, 0, 1, t));
  }
  return colors;
}

// should return an array of values that is compatible with the "heatmap-color" property of a heatmap layer
// So it will be an array like: [0, 'color1', 0.2, 'color2', 0.4, 'color3', ..., 1, 'colorN']
export function createHeatmapColorMap(colormapName: AllAvailableColorMaps = 'viridis', steps: number[] = [0.1, 0.2, 0.4, 0.6, 0.8, 1], transparentTo = 0): Array<number | string> {
  const colors: Array<string | number> = [];
  
  // start with fully transparent
  colors.push(0);
  colors.push('rgba(0,0,0,0)'); 
  
  let transparentAdded = false;
  // then add colors from transparentTo to 1
  for (const t of steps) {
    const [r, g, b] = colormap(colormapName, 0, 1, t);
    const c = `rgb(${r},${g},${b})`;
    if (transparentTo < t && !transparentAdded) {
      console.log('Adding transparent to color at', transparentTo, c);
      colors.push(transparentTo);
      colors.push(c);
      transparentAdded = true;
    }
    colors.push(t);
    colors.push(c);
  }
  return colors;
  
}

export function previewColormapInConsole(colormapName: AllAvailableColorMaps = 'viridis', steps: number[] = [0.1, 0.2, 0.4, 0.6, 0.8, 1], transparentTo = 0) {
  // using console log stying appling hte color to a character
  const colors = createHeatmapColorMap(colormapName, steps, transparentTo);
  let str = '';
  const style: string[] = [];
  for (let i = 0; i < colors.length; i += 2) {
    // const t = colors[i];
    const c = colors[i + 1];
    str += '%c█';
    style.push(`color: ${c}`);
  }
  console.log('%cColormap: ' + colormapName, 'font-weight: bold;');
  console.log(str, ...style);
}

export function colormapFunction(cmapName: string) {
  return (x: number) => {
    let rgb: number[] = [128, 128, 128];
    try {
      rgb = colormap(cmapName.toLowerCase() as AllAvailableColorMaps, 0, 1, x);
    }
    catch {
      console.log("no valid colormap. returning gray");
    }
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},1)`;
  };
}
